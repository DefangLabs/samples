const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

/**
 * Determine if a secret should be auto-generated (random) or user-provided
 * Random: passwords, secret keys, encryption keys
 * User-provided: API keys, tokens, cloud credentials (AWS, GCP, etc.)
 */
function isRandomSecret(name) {
    const upper = name.toUpperCase();

    // Cloud provider credentials are always user-provided
    if (upper.startsWith('AWS_')) return false;
    if (upper.startsWith('GCP_')) return false;
    if (upper.startsWith('AZURE_')) return false;

    if (upper.includes('PASSWORD')) return true;
    if (upper.includes('SECRET')) return true;
    if (upper.includes('ENCRYPTION_KEY')) return true;
    return false;
}

/**
 * Extract secrets from compose.yaml content
 * Secrets are env vars with null value or array format without value
 */
function extractSecretsFromCompose(composeContent) {
    const doc = yaml.parse(composeContent);
    const secrets = new Set();

    if (!doc?.services) return { random: [], userProvided: [] };

    for (const service of Object.values(doc.services)) {
        const env = service.environment;
        if (!env) continue;

        if (Array.isArray(env)) {
            // Array format: ["VAR1=value", "VAR2", "VAR3=${VAR3}", "URL=redis://$PASSWORD"]
            // VAR2 (no =) is a secret, and any interpolated vars ($VAR or ${VAR}) are secrets
            for (const item of env) {
                if (typeof item !== 'string') continue;

                if (!item.includes('=')) {
                    // No value: "VAR" - definitely a secret
                    secrets.add(item);
                } else {
                    // Has value - extract any interpolated variables
                    const value = item.substring(item.indexOf('=') + 1);
                    // Match $VAR or ${VAR} patterns
                    const matches = value.matchAll(/\$\{?([A-Z_][A-Z0-9_]*)\}?/gi);
                    for (const match of matches) {
                        secrets.add(match[1]);
                    }
                }
            }
        } else if (typeof env === 'object') {
            // Object format: { VAR1: "value", VAR2: null } - VAR2 is a secret
            for (const [key, value] of Object.entries(env)) {
                if (value === null) {
                    secrets.add(key);
                }
            }
        }
    }

    // Classify secrets
    const random = [];
    const userProvided = [];

    for (const secret of secrets) {
        if (isRandomSecret(secret)) {
            random.push(secret);
        } else {
            userProvided.push(secret);
        }
    }

    return {
        random: random.sort(),
        userProvided: userProvided.sort()
    };
}

/**
 * Find the first step that uses defang-github-action (the deploy step, not summary)
 */
function findDefangDeployStep(doc) {
    const jobs = doc.get('jobs');
    if (!jobs) return null;

    for (const job of jobs.items) {
        const steps = job.value?.get('steps');
        if (!steps) continue;

        for (const step of steps.items) {
            const uses = step.get('uses');
            const name = step.get('name');
            // Find the deploy step (not the summary step)
            if (uses && typeof uses === 'string' &&
                uses.includes('defang-github-action') &&
                name && typeof name === 'string' &&
                name.toLowerCase().includes('defang') &&
                !name.toLowerCase().includes('summary')) {
                return step;
            }
        }
    }
    return null;
}

/**
 * Generate workflow from template with secrets
 */
function generateWorkflow(template, secrets) {
    const templateDoc = yaml.parseDocument(template);
    const step = findDefangDeployStep(templateDoc);

    if (!step) {
        console.warn('Could not find defang deploy step in template');
        return templateDoc.toString();
    }

    // Add config-vars-init-random if there are random secrets
    if (secrets.random.length > 0) {
        step.setIn(['with', 'config-vars-init-random'], secrets.random.join(' '));
    }

    // Add config-env-vars if there are user-provided secrets
    if (secrets.userProvided.length > 0) {
        step.setIn(['with', 'config-env-vars'], secrets.userProvided.join(' '));
    }

    // Add env block with all secrets
    const allSecrets = [...secrets.random, ...secrets.userProvided];
    if (allSecrets.length > 0) {
        const envMap = new yaml.YAMLMap();
        for (const secret of allSecrets) {
            envMap.add(new yaml.Pair(secret, `\${{ secrets.${secret} }}`));
        }
        step.set('env', envMap);
    }

    return templateDoc.toString();
}

/**
 * Load the canonical workflow template
 */
function loadWorkflowTemplate() {
    return fs.readFileSync(
        path.join(__dirname, '..', 'templates', 'deploy.yaml'),
        'utf8'
    );
}

module.exports = {
    isRandomSecret,
    extractSecretsFromCompose,
    findDefangDeployStep,
    generateWorkflow,
    loadWorkflowTemplate
};
