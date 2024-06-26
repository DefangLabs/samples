# Directus + PostgreSQL

This sample project demonstrates how to deploy Directus with Defang and connect it to a PostgreSQL database. We also demonstrate how to run a PostgreSQL container during development and how to switch over to a managed PostgreSQL service like Neon in production. If you want to get a compatible database ready to go really quickly for free, [Neon](https://neon.tech/) is a quick and easy way to go.

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. (Optional) If you are using [Defang BYOC](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) authenticated with your AWS account
3. (Optional - for local development) [Docker CLI](https://docs.docker.com/engine/install/)

### Editing the database/permissions etc.

If you want to edit the database, permissions, or any other Directus settings such that you can deploy them to production, you should make those changes in the Directus admin interface. Any changes you make in the admin interface will be saved to the database.

## Deploying

1. Open the terminal and type `defang login`
2. Add your connection string to the `DB_CONNECTION_STRING` on `compose.yaml` (which should be in the format `postgres://username:password@host:port/dbname`)
3. Setup all the env variables by doing the following

   - `defang config set SECRET`
   - `defang config set ADMIN_EMAIL`
   - `defang config set ADMIN_PASSWORD`
   - `defang config set DB_CONNECTION_STRING`

4. Type `defang compose up` in the CLI. 5. Your app will be running within a few minutes.

## Development

`For development, we use a PostgreSQL container. The PostgreSQL container is defined in the`compose.dev.yaml`file. The Directus container is defined in the`docker-compose.yaml`file, with some overrides in the`compose.dev.yaml` file so it can correctly connect to the development database container.

To start the development environment, run
`docker-compose -f compose.dev.yaml up -d`

This will start the PostgreSQL container and the Directus container. The Directus console will be available at `http://localhost:8055` with the admin email `admin@example.com` and password `d1r3ctu5`. (you can change these as you may)

**Note:** _If you want to make changes to your database, permissions, etc., you should use the Directus console to make those changes._

---

Title: Directus + PostgreSQL

Short Description: A sample project demonstrating how to deploy Directus with Defang and connect it to a PostgreSQL database

Tags: directus, cms, postgres, database

Languages: sql, cms
