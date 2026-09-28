# Immutable, non-root container for the documentation site.
# Build from the repository root (the site syncs public sources from the repo):
#   docker build -f website/Dockerfile -t know-me-project-management-docs .
#   docker run --rm --read-only --tmpfs /tmp -p 8080:8080 know-me-project-management-docs
# Served at http://localhost:8080/ (BASE_URL=/ inside the container).

FROM node:22-alpine AS build
WORKDIR /repo
COPY website/package.json website/package-lock.json ./website/
RUN cd website && npm ci
# Dockerfile.dockerignore admits only the public sources listed in content-sources.json.
COPY . .
ENV SITE_URL=http://localhost:8080 BASE_URL=/
RUN cd website && npm run build

FROM nginxinc/nginx-unprivileged:1.29-alpine
COPY --chown=101:101 --from=build /repo/website/build /usr/share/nginx/html
USER 101
EXPOSE 8080
