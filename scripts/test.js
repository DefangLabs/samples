const { Octokit } = require('@octokit/rest');

async function main() {
    const token = process.env.TEMPLATES_MANAGER_TOKEN;

    const github = new Octokit({
        auth: token,
    });

    async function getAllReposForOrg(org) {
        let repos = [];
        let page = 1;
    
        while (true) {
            const response = await github.repos.listForOrg({
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

    const whoami = await github.users.getAuthenticated();

    const repos = await getAllReposForOrg('DefangLabs');
    
    const templateRepoName = `sample-2-template`;

    const exists = repos.map(r => r.name).includes(templateRepoName);
    console.log(`@@ repo exists: ${exists}`);

    if(exists) {
        return
    }

    console.log(`Creating template repo: ${templateRepoName}`);
    await github.repos.createInOrg({
        name: templateRepoName,
        org: 'DefangLabs',
        private: false,
        is_template: true,
    });

    
}

main();
