const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const {
    extractSecretsFromCompose,
    generateWorkflow,
    loadWorkflowTemplate
} = require('./workflow-utils');

// Load canonical workflow template
const WORKFLOW_TEMPLATE = loadWorkflowTemplate();

const DRY_RUN = process.env.DRY_RUN === 'true';

/**
 * Generate workflow for a sample directory (reads compose.yaml from path)
 */
function generateWorkflowForSample(samplePath) {
    const composePaths = ['compose.yaml', 'compose.yml'];
    let composeContent = null;

    for (const file of composePaths) {
        const fullPath = path.join(samplePath, file);
        if (fs.existsSync(fullPath)) {
            composeContent = fs.readFileSync(fullPath, 'utf8');
            break;
        }
    }

    if (!composeContent) {
        return generateWorkflow(WORKFLOW_TEMPLATE, { random: [], userProvided: [] });
    }

    const secrets = extractSecretsFromCompose(composeContent);
    return { workflow: generateWorkflow(WORKFLOW_TEMPLATE, secrets), secrets };
}

/**
 * Update the workflow file based on compose.yaml in the current directory
 */
function updateWorkflowFromCompose() {
    // Read compose.yaml (try both .yaml and .yml)
    let composeContent = null;
    const composePaths = ['compose.yaml', 'compose.yml'];

    for (const composePath of composePaths) {
        if (fs.existsSync(composePath)) {
            composeContent = fs.readFileSync(composePath, 'utf8');
            break;
        }
    }

    if (!composeContent) {
        console.log('No compose.yaml found, using template as-is');
        return generateWorkflow(WORKFLOW_TEMPLATE, { random: [], userProvided: [] });
    }

    // Extract secrets and generate workflow
    const secrets = extractSecretsFromCompose(composeContent);

    if (secrets.random.length > 0 || secrets.userProvided.length > 0) {
        console.log(`Found secrets - random: [${secrets.random.join(', ')}], user: [${secrets.userProvided.join(', ')}]`);
    }

    return generateWorkflow(WORKFLOW_TEMPLATE, secrets);
}

/**
 * This function returns the value of the client payload from the context.
 *
 * @param {Object} args - The arguments object.
 * @param {Object} args.github - The GitHub object.
 * @param {import('@octokit/rest').Octokit} args.github.rest - The GitHub SDK instance.
 * @param {import('@actions/github').Context} args.context - The context of the GitHub action.
 * @param {import('@actions/core')} args.core - The context of the GitHub action.
 * @returns {any} The value of the client payload.
 */
module.exports = async ({ github, context, core }) => {
    async function getAllReposForOrg(org) {
        let repos = [];
        let page = 1;

        while (true) {
            const response = await github.rest.repos.listForOrg({
                org: org,
                type: 'public',
                per_page: 100,
                page: page
            });

            if (response.data.length === 0) break; // No more repos to retrieve

            repos = repos.concat(response.data);
            page++;
        }

        return repos;
    }

    // read the modified samples
    let modified = fs.readFileSync(path.join('modified.txt'), 'utf8').trim();

    console.log('@@ modified: ', modified);

    if (!modified) {
        return;
    }

    const modifiedSamples = modified.split('\n').map(s => s.split('/')?.[1]);

    // Dry-run mode: show diff between current and generated workflows
    if (DRY_RUN) {
        console.log('@@ DRY RUN MODE - showing workflow diffs\n');
        const templateOrg = 'DefangSamples';

        for (const sample of modifiedSamples) {
            const templateRepoName = `sample-${sample}-template`;
            const samplePath = path.join('samples', sample);
            const { workflow: newWorkflow, secrets } = generateWorkflowForSample(samplePath);

            console.log(`\n${'='.repeat(60)}`);
            console.log(`# Sample: ${sample}`);
            if (secrets?.random?.length > 0) {
                console.log(`# Random secrets: ${secrets.random.join(', ')}`);
            }
            if (secrets?.userProvided?.length > 0) {
                console.log(`# User-provided secrets: ${secrets.userProvided.join(', ')}`);
            }
            console.log(`${'='.repeat(60)}`);

            // Fetch current workflow from template repo
            let currentWorkflow = null;
            try {
                const response = await github.rest.repos.getContent({
                    owner: templateOrg,
                    repo: templateRepoName,
                    path: '.github/workflows/deploy.yaml'
                });
                currentWorkflow = Buffer.from(response.data.content, 'base64').toString();
            } catch (err) {
                if (err.status === 404) {
                    console.log('(new repo - no existing workflow)\n');
                    console.log(newWorkflow);
                    continue;
                }
                throw err;
            }

            // Show diff
            if (currentWorkflow === newWorkflow) {
                console.log('(no changes)\n');
            } else {
                const currentLines = currentWorkflow.split('\n');
                const newLines = newWorkflow.split('\n');

                console.log('');
                // Simple unified diff
                for (let i = 0; i < Math.max(currentLines.length, newLines.length); i++) {
                    const curr = currentLines[i];
                    const next = newLines[i];
                    if (curr !== next) {
                        if (curr !== undefined) console.log(`- ${curr}`);
                        if (next !== undefined) console.log(`+ ${next}`);
                    }
                }
                console.log('');
            }
        }
        return { modifiedSamples, dryRun: true };
    }

    const currentBranch = process.env.GITHUB_HEAD_REF.split('/').pop() || 'main';
    const isMain = currentBranch === 'main';
    const remoteBranch = isMain ? 'main' : `pr-test/${currentBranch}`;
    const workRef = 'workRef';

    try {
        console.log('@@ preparing git')
        execSync(`git config --global user.name 'GitHub Actions'`);
        execSync(`git config --global user.email 'actions@github.com'`);
        execSync(`git config --unset-all http.https://github.com/.extraheader`);

        // this is a branch we'll use as our starting point from
        // which we'll split subtrees
        execSync(`git checkout -b ${workRef}`);
    } catch (err) {
        throw new Error(`exec error: ${err}`);
    }

    const templateOrg = 'DefangSamples';
    const repos = await getAllReposForOrg(templateOrg);
    const repoNames = repos.map(r => r.name);
    console.log('@@ repos: ', repoNames);

    // for each sample, create or update the template repo
    for (const sample of modifiedSamples) {
        const templateRepoName = `sample-${sample}-template`;

        const authedRemote = `https://x-access-token:${process.env.PUSH_TOKEN}@github.com/${templateOrg}/${templateRepoName}.git`
        const splitBranch = sample;

        const isNew = !repoNames.includes(templateRepoName);



        console.log(
            `@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@@ sample: ${sample}
@@ templateRepoName: ${templateRepoName}
@@ isNew: ${isNew}
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@`
        )

        if (isNew) {
            console.log(`Creating template repo: ${templateRepoName}`);
            await github.rest.repos.createInOrg({
                name: templateRepoName,
                org: templateOrg,
                private: false,
                is_template: true,
            });
        }

        console.log(`Pushing to template repo: ${templateRepoName}`);

        try {
            const stdout1 = execSync(`git subtree split --prefix samples/${sample} -b ${splitBranch}`);
            console.log(`stdout: ${stdout1.toString()}`);

            const stdout2 = execSync(`git checkout ${splitBranch}`);
            console.log(`stdout: ${stdout2.toString()}`);

            // Generate workflow from compose.yaml and write it
            console.log(`@@ Generating workflow from compose.yaml`);
            const workflowContent = updateWorkflowFromCompose();
            const workflowDir = '.github/workflows';
            const workflowPath = `${workflowDir}/deploy.yaml`;

            // Ensure directory exists
            if (!fs.existsSync(workflowDir)) {
                fs.mkdirSync(workflowDir, { recursive: true });
            }

            // Write the generated workflow
            fs.writeFileSync(workflowPath, workflowContent);
            console.log(`@@ Wrote workflow to ${workflowPath}`);

            // Stage and commit the workflow change
            execSync(`git add ${workflowPath}`);
            try {
                execSync(`git commit --amend --no-edit`);
                console.log(`@@ Amended commit with generated workflow`);
            } catch (commitErr) {
                // If amend fails (no changes), that's ok
                console.log(`@@ No workflow changes to commit`);
            }

            if (isNew) {
                console.log(`@@ is ${sample} new? ${isNew} - Pushing to main branch`);
                const stdout4 = execSync(`git push ${authedRemote} ${splitBranch}:main --force`);
                console.log(`stdout: ${stdout4.toString()}`);
            }

            const stdout3 = execSync(`git push ${authedRemote} ${splitBranch}:${remoteBranch} --force`);
            console.log(`stdout: ${stdout3.toString()}`);

            // reset
            const stdout5 = execSync(`git checkout ${workRef}`);
            console.log(`stdout: ${stdout5.toString()}`);
        } catch (err) {
            console.error(`exec error: ${err}`);
            throw new Error(`exec error: ${err}`);
        }
    }

    return {
        modifiedSamples,
        repos
    }
}
