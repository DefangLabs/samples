# Django

[![1-click-deploy](https://defang.io/deploy-with-defang.png)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-django-template%26template_owner%3DDefangSamples)

This sample is a simple Django to-do app that uses SQLite as the database, which will be reset every time you deploy. **It is not production-ready**. For production use cases, you should check out the Django + Postgres sample.

The app includes a management command which is run on startup to create a superuser with the username `admin` and password `admin`. This means you can login to the admin interface at `/admin/` and see the Django admin interface without any additional steps. The `example_app` is already registered and the `Todo` model is already set up to be managed in the admin interface.

The Dockerfile and compose files are already set up for you and are ready to be deployed. Serving is done using [Gunicorn](https://gunicorn.org/) and uses [WhiteNoise](https://whitenoise.readthedocs.io/en/latest/) for static files. The `CSRF_TRUSTED_ORIGINS` setting is configured to allow the app to run on a `defang.dev` subdomain.

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. (Optional) If you are using [Defang BYOC](https://docs.defang.io/docs/concepts/defang-byoc) authenticate with your cloud provider account
3. (Optional for local development) [Docker CLI](https://docs.docker.com/engine/install/)

## Development

To run the application locally, you can use the following command:

```bash
docker compose up --build
```

## Configuration

For this sample, you will not need to provide [configuration](https://docs.defang.io/docs/concepts/configuration). 

If you wish to provide configuration, see below for an example of setting a configuration for a value named `API_KEY`.

```bash
defang config set API_KEY
```

## Deployment

> [!NOTE]
> Download [Defang CLI](https://github.com/DefangLabs/defang)

### Defang Playground

Deploy your application to the Defang Playground by opening up your terminal and typing:
```bash
defang compose up
```

### BYOC (AWS)

If you want to deploy to your own cloud account, you can use Defang BYOC:

1. [Authenticate your AWS account](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html), and check that you have properly set your environment variables like `AWS_PROFILE`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY`.
2. Make sure to update the `CSRF_TRUSTED_ORIGINS` setting in the `settings.py` file to include an appropriate domain.
3. Run in a terminal that has access to your AWS environment variables:
    ```bash
    defang --provider=aws compose up
    ```

---

Title: Django

Short Description: A simple Django app that uses SQLite as the database.

Tags: Django, SQLite, Python

Languages: python
