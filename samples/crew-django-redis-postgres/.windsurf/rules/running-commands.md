---
trigger: always_on
---

Whenever you run commands for this project, run them in the relevant docker containers.

i.e. if you need to install a new package, use `docker compose run --rm` to install. Feel free to use volume mounts to persist the results, change the entrypoint, etc. Anything you need to. But the commands and deps need to work in the containerized environment, which is why I'm going to require you to work this way.