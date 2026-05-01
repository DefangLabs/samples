const {
    extractSecretsFromCompose,
    generateWorkflow,
    loadWorkflowTemplate
} = require('./workflow-utils');

// Load canonical template
const TEMPLATE = loadWorkflowTemplate();

/**
 * Get all repositories for an organization (paginated)
 */
async function getAllReposForOrg(github, org) {
    let repos = [];
    let page = 1;

    while (true) {
        const response = await github.rest.repos.listForOrg({
            org: org,
            type: 'public',
            per_page: 100,
            page: page
        });

        if (response.data.length === 0) break;

        repos = repos.concat(response.data);
        page++;
    }

    return repos;
}

/**
 * Update workflow files in all template repos
 *
 * @param {Object} args - The arguments object.
 * @param {Object} args.github - The GitHub object.
 * @param {import('@octokit/rest').Octokit} args.github.rest - The GitHub SDK instance.
 * @param {import('@actions/github').Context} args.context - The context of the GitHub action.
 * @param {import('@actions/core')} args.core - The core module from GitHub actions.
 */
module.exports = async ({ github, context, core }) => {
    const templateOrg = 'DefangSamples';
    const repos = await getAllReposForOrg(github, templateOrg);

    console.log(`Found ${repos.length} repos in ${templateOrg}`);

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const repo of repos) {
        if (!repo.name.endsWith('-template')) {
            continue;
        }

        try {
            // Get compose.yaml to extract secrets
            let composeContent = null;
            try {
                const response = await github.rest.repos.getContent({
                    owner: templateOrg,
                    repo: repo.name,
                    path: 'compose.yaml'
                });
                composeContent = Buffer.from(response.data.content, 'base64').toString();
            } catch (err) {
                if (err.status === 404) {
                    console.log(`${repo.name}: no compose.yaml found, using template as-is`);
                } else {
                    throw err;
                }
            }

            // Extract secrets from compose.yaml
            const secrets = composeContent
                ? extractSecretsFromCompose(composeContent)
                : { random: [], userProvided: [] };

            if (secrets.random.length > 0 || secrets.userProvided.length > 0) {
                console.log(`${repo.name}: found secrets - random: [${secrets.random.join(', ')}], user: [${secrets.userProvided.join(', ')}]`);
            }

            // Generate workflow from template + secrets
            const updatedContent = generateWorkflow(TEMPLATE, secrets);

            const getFile = async (path) => {
                try {
                    const response = await github.rest.repos.getContent({
                        owner: templateOrg,
                        repo: repo.name,
                        path
                    });
                    return response.data;
                } catch (err) {
                    if (err.status === 404) return null;
                    throw err;
                }
            };

            const currentFile = await getFile('.github/workflows/defang.yaml');
            const legacyFile = await getFile('.github/workflows/deploy.yaml');

            if (!currentFile && !legacyFile) {
                console.log(`${repo.name}: no workflow file found, skipping`);
                skipped++;
                continue;
            }

            const currentContent = currentFile
                ? Buffer.from(currentFile.content, 'base64').toString()
                : null;

            const needsContentUpdate = currentContent !== updatedContent;
            const needsLegacyDelete = !!legacyFile;

            if (!needsContentUpdate && !needsLegacyDelete) {
                console.log(`${repo.name}: already up to date`);
                skipped++;
                continue;
            }

            if (needsContentUpdate) {
                await github.rest.repos.createOrUpdateFileContents({
                    owner: templateOrg,
                    repo: repo.name,
                    path: '.github/workflows/defang.yaml',
                    message: 'Update workflow from canonical template',
                    content: Buffer.from(updatedContent).toString('base64'),
                    ...(currentFile ? { sha: currentFile.sha } : {})
                });
            }

            if (needsLegacyDelete) {
                await github.rest.repos.deleteFile({
                    owner: templateOrg,
                    repo: repo.name,
                    path: '.github/workflows/deploy.yaml',
                    message: 'Remove legacy deploy.yaml (renamed to defang.yaml)',
                    sha: legacyFile.sha
                });
            }

            console.log(`${repo.name}: updated${needsLegacyDelete ? ' (removed legacy deploy.yaml)' : ''}`);
            updated++;
        } catch (err) {
            console.error(`${repo.name}: failed - ${err.message}`);
            failed++;
        }
    }

    console.log(`\nSummary: ${updated} updated, ${skipped} skipped, ${failed} failed`);

    return { updated, skipped, failed };
};
