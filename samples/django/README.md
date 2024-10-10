# Django

[![1-click-deploy](https://defang.io/deploy-with-defang.png)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-django-template%26template_owner%3DDefangSamples)

This is a simple example of how to run Django on Defang. It is a simple Todo app that uses SQLite as the database.

### NOTE

This sample is a simple Django app that uses SQLite as the database, which will be reset every time you deploy. **It is not production-ready**. For production use cases, you should check out the Django + Postgres sample.

The app includes a management command which is run on startup to create a superuser with the username `admin` and password `admin`. This means you can login to the admin interface at `/admin/` and see the Django admin interface without any additional steps. The `example_app` is already registered and the `Todo` model is already set up to be managed in the admin interface.

The Dockerfile and compose files are already set up for you and are ready to be deployed. Serving is done using [Gunicorn](https://gunicorn.org/) and uses [WhiteNoise](https://whitenoise.readthedocs.io/en/latest/) for static files. The `CSRF_TRUSTED_ORIGINS` setting is configured to allow the app to run on a `defang.dev` subdomain.

## Essential Setup Files

1. A [Dockerfile](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/) to describe the basic image of your applications.
2. A [docker-compose file](https://docs.defang.io/docs/concepts/compose) to define and run multi-container Docker applications.
3. A [.dockerignore](https://docs.docker.com/build/building/context/#dockerignore-files) file to comply with the size limit (10MB).

## Prerequisite

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. If you are using [Defang BYOC](https://docs.defang.io/docs/concepts/defang-byoc), make sure you have properly [authenticated your AWS account](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html)
   Plus, make sure that you have properly set your environment variables like `AWS_PROFILE`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY`.

## A Step-by-Step Guide

1. (optional) If you are using Defang BYOC, make sure to update the `CSRF_TRUSTED_ORIGINS` setting in the `settings.py` file to include an appropriate domain.
2. Open the terminal and type `defang login`
3. Type `defang compose up` in the CLI
4. Now your application will be launched

---

Title: Django

Short Description: A simple Django app that uses SQLite as the database.

Tags: Django, SQLite, Python

Languages: python
