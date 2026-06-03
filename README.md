# Docker start instructions

First, down all containers and remove all images (This will ensure that you are building fresh images with the latest code changes):
```ps
docker compose down --rmi all
```

Then, build and start all containers (This will take a while the first time, as it needs to build all images):
```ps
docker compose up --build
```

Once you see
```
nova-frontend    |  GET / 200 in 74ms (next.js: 5ms, application-code: 69ms)
```
in the logs, that means the docker is finished building.