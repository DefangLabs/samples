FROM jupyter/datascience-notebook

# 4.002       Error: pg_config executable not found.
# make sure the development packages are installed

USER root

RUN apt-get update && apt-get install -y libpq-dev

USER 1000

COPY requirements.txt /tmp/
RUN pip install --no-cache-dir -r /tmp/requirements.txt

COPY ./notebooks /home/jovyan/work