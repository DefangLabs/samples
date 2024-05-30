const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

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

    // console log the current working directory
    console.log('@@ cwd: ', process.cwd());

    // console log the contents of the current directory
    console.log('@@ ls: ', fs.readdirSync(process.cwd()));

    // read the modified samples
    let modified = fs.readFileSync(path.join('modified.txt'), 'utf8').trim();

    console.log('@@ modified: ', modified);

    if (!modified) {
        return;
    }

    const currentBranch = process.env.GITHUB_HEAD_REF.split('/').pop() || 'main';
    const isMain = currentBranch === 'main';
    const remoteBranch = isMain ? 'main' : `pr-test/${currentBranch}`;

    try {
        console.log('@@ preparing git')
        execSync(`git config --global user.name 'GitHub Actions'`);
        execSync(`git config --global user.email 'actions@github.com'`);
        execSync(`git config --unset-all http.https://github.com/.extraheader`);

        if(!isMain) {
            execSync(`git checkout -b ${remoteBranch}`);
        }
        else {
            execSync(`git checkout ${currentBranch}`);
        }
    } catch (err) {
        throw new Error(`exec error: ${err}`);
    }

    const repos = await getAllReposForOrg('DefangLabs');
    const repoNames = repos.map(r => r.name);
    console.log('@@ repos: ', repoNames);

    const modifiedSamples = modified.split('\n').map(s => s.split('/')?.[1])

    // for each sample, create or update the template repo
    for (const sample of modifiedSamples) {
        const templateRepoName = `sample-${sample}-template`;

        const authedRemote = `https://x-access-token:${process.env.PUSH_TOKEN}@github.com/DefangLabs/${templateRepoName}.git`
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
                org: 'DefangLabs',
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

            if (isNew) {
                console.log(`@@ is ${sample} new? ${isNew} - Pushing to main branch`);
                const stdout4 = execSync(`git push ${authedRemote} ${splitBranch}:main --force`);
                console.log(`stdout: ${stdout4.toString()}`);
            }

            const stdout3 = execSync(`git push ${authedRemote} ${splitBranch}:${remoteBranch} --force`);
            console.log(`stdout: ${stdout3.toString()}`);

            const stdout5 = execSync(`git checkout ${currentBranch}`);
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