const { describe, it } = require('node:test');
const assert = require('node:assert');
const { isRandomSecret, extractSecretsFromCompose, generateWorkflow } = require('./workflow-utils');

describe('isRandomSecret', () => {
    it('should classify PASSWORD as random', () => {
        assert.strictEqual(isRandomSecret('POSTGRES_PASSWORD'), true);
        assert.strictEqual(isRandomSecret('DB_PASSWORD'), true);
        assert.strictEqual(isRandomSecret('password'), true);
        assert.strictEqual(isRandomSecret('MONGO_INITDB_ROOT_PASSWORD'), true);
    });

    it('should classify SECRET as random', () => {
        assert.strictEqual(isRandomSecret('SECRET_KEY'), true);
        assert.strictEqual(isRandomSecret('DJANGO_SECRET_KEY'), true);
        assert.strictEqual(isRandomSecret('SESSION_SECRET'), true);
        assert.strictEqual(isRandomSecret('SECRET_KEY_BASE'), true);
        assert.strictEqual(isRandomSecret('NC_S3_ACCESS_SECRET'), true);
    });

    it('should classify ENCRYPTION_KEY as random', () => {
        assert.strictEqual(isRandomSecret('N8N_ENCRYPTION_KEY'), true);
        assert.strictEqual(isRandomSecret('ENCRYPTION_KEY'), true);
    });

    it('should classify API keys as user-provided', () => {
        assert.strictEqual(isRandomSecret('OPENAI_API_KEY'), false);
        assert.strictEqual(isRandomSecret('ANTHROPIC_API_KEY'), false);
        assert.strictEqual(isRandomSecret('TAVILY_API_KEY'), false);
        assert.strictEqual(isRandomSecret('MISTRAL_API_KEY'), false);
    });

    it('should classify tokens as user-provided', () => {
        assert.strictEqual(isRandomSecret('GITHUB_TOKEN'), false);
        assert.strictEqual(isRandomSecret('JUPYTER_TOKEN'), false);
    });

    it('should classify cloud credentials as user-provided', () => {
        assert.strictEqual(isRandomSecret('AWS_ACCESS_KEY'), false);
        assert.strictEqual(isRandomSecret('AWS_SECRET_KEY'), false);
        assert.strictEqual(isRandomSecret('AWS_SECRET_ACCESS_KEY'), false);
        assert.strictEqual(isRandomSecret('GCP_SERVICE_ACCOUNT'), false);
        assert.strictEqual(isRandomSecret('AZURE_CLIENT_SECRET'), false);
        assert.strictEqual(isRandomSecret('NC_S3_ACCESS_KEY'), false);
    });

    it('should classify misc config as user-provided', () => {
        assert.strictEqual(isRandomSecret('MODEL'), false);
        assert.strictEqual(isRandomSecret('ALLOWED_HOSTS'), false);
        assert.strictEqual(isRandomSecret('SSL_MODE'), false);
    });
});

describe('extractSecretsFromCompose', () => {
    it('should extract secrets with null values (object format)', () => {
        const compose = `
services:
  app:
    environment:
      POSTGRES_PASSWORD: null
      DJANGO_SECRET_KEY: null
      DATABASE_URL: postgres://localhost
`;
        const result = extractSecretsFromCompose(compose);
        assert.deepStrictEqual(result.random, ['DJANGO_SECRET_KEY', 'POSTGRES_PASSWORD']);
        assert.deepStrictEqual(result.userProvided, []);
    });

    it('should extract secrets without values (array format)', () => {
        const compose = `
services:
  app:
    environment:
      - OPENAI_API_KEY
      - DATABASE_URL=postgres://localhost
`;
        const result = extractSecretsFromCompose(compose);
        assert.deepStrictEqual(result.random, []);
        assert.deepStrictEqual(result.userProvided, ['OPENAI_API_KEY']);
    });

    it('should extract interpolated secrets ($VAR and ${VAR} formats)', () => {
        const compose = `
services:
  app:
    environment:
      - MISTRAL_API_KEY=\${MISTRAL_API_KEY}
      - DATABASE_URL=redis://user:\$PASSWORD@host
      - CONN_STRING=postgres://\${DB_USER}:\${DB_PASSWORD}@host
      - STATIC_VAR=plain_value
`;
        const result = extractSecretsFromCompose(compose);
        assert.deepStrictEqual(result.random, ['DB_PASSWORD', 'PASSWORD']);
        assert.deepStrictEqual(result.userProvided, ['DB_USER', 'MISTRAL_API_KEY']);
    });

    it('should handle mixed secret types', () => {
        const compose = `
services:
  db:
    environment:
      POSTGRES_PASSWORD: null
  app:
    environment:
      - OPENAI_API_KEY
      - SECRET_KEY
`;
        const result = extractSecretsFromCompose(compose);
        assert.deepStrictEqual(result.random, ['POSTGRES_PASSWORD', 'SECRET_KEY']);
        assert.deepStrictEqual(result.userProvided, ['OPENAI_API_KEY']);
    });

    it('should deduplicate secrets across services', () => {
        const compose = `
services:
  app:
    environment:
      POSTGRES_PASSWORD: null
  worker:
    environment:
      POSTGRES_PASSWORD: null
`;
        const result = extractSecretsFromCompose(compose);
        assert.deepStrictEqual(result.random, ['POSTGRES_PASSWORD']);
        assert.deepStrictEqual(result.userProvided, []);
    });

    it('should return empty arrays when no secrets', () => {
        const compose = `
services:
  app:
    environment:
      DATABASE_URL: postgres://localhost
      PORT: "3000"
`;
        const result = extractSecretsFromCompose(compose);
        assert.deepStrictEqual(result.random, []);
        assert.deepStrictEqual(result.userProvided, []);
    });

    it('should handle services without environment', () => {
        const compose = `
services:
  app:
    image: nginx
`;
        const result = extractSecretsFromCompose(compose);
        assert.deepStrictEqual(result.random, []);
        assert.deepStrictEqual(result.userProvided, []);
    });

    it('should handle empty compose', () => {
        const result = extractSecretsFromCompose('');
        assert.deepStrictEqual(result.random, []);
        assert.deepStrictEqual(result.userProvided, []);
    });

    // Real-world test cases from samples
    it('should handle crewai compose', () => {
        const compose = `
services:
  postgres:
    environment:
      POSTGRES_PASSWORD: null
  app:
    environment:
      DJANGO_SECRET_KEY: null
      DATABASE_URL: postgres://localhost
`;
        const result = extractSecretsFromCompose(compose);
        assert.deepStrictEqual(result.random, ['DJANGO_SECRET_KEY', 'POSTGRES_PASSWORD']);
        assert.deepStrictEqual(result.userProvided, []);
    });

    it('should handle langchain compose', () => {
        const compose = `
services:
  langchain-app:
    environment:
      - OPENAI_KEY
`;
        const result = extractSecretsFromCompose(compose);
        assert.deepStrictEqual(result.random, []);
        assert.deepStrictEqual(result.userProvided, ['OPENAI_KEY']);
    });

    it('should handle django-postgres compose', () => {
        const compose = `
services:
  db:
    environment:
      - POSTGRES_PASSWORD
  app:
    environment:
      - POSTGRES_PASSWORD
      - SECRET_KEY
      - ALLOWED_HOSTS
`;
        const result = extractSecretsFromCompose(compose);
        assert.deepStrictEqual(result.random, ['POSTGRES_PASSWORD', 'SECRET_KEY']);
        assert.deepStrictEqual(result.userProvided, ['ALLOWED_HOSTS']);
    });
});

describe('generateWorkflow', () => {
    const template = `
name: Deploy
on:
  push:
    branches:
      - main
jobs:
  defang:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repo
        uses: actions/checkout@v4
      - name: Defang up
        uses: DefangLabs/defang-github-action@v1.4.0
        with:
          command: up
`;

    it('should add config-vars-init-random for random secrets', () => {
        const secrets = { random: ['POSTGRES_PASSWORD'], userProvided: [] };
        const result = generateWorkflow(template, secrets);
        assert.ok(result.includes('config-vars-init-random: POSTGRES_PASSWORD'));
    });

    it('should add config-env-vars for user-provided secrets', () => {
        const secrets = { random: [], userProvided: ['OPENAI_API_KEY'] };
        const result = generateWorkflow(template, secrets);
        assert.ok(result.includes('config-env-vars: OPENAI_API_KEY'));
    });

    it('should add env block with secrets', () => {
        const secrets = { random: ['PASSWORD'], userProvided: ['API_KEY'] };
        const result = generateWorkflow(template, secrets);
        assert.ok(result.includes('PASSWORD: ${{ secrets.PASSWORD }}'));
        assert.ok(result.includes('API_KEY: ${{ secrets.API_KEY }}'));
    });

    it('should not modify template when no secrets', () => {
        const secrets = { random: [], userProvided: [] };
        const result = generateWorkflow(template, secrets);
        assert.ok(!result.includes('config-vars-init-random'));
        assert.ok(!result.includes('config-env-vars'));
        assert.ok(!result.includes('env:'));
    });
});
