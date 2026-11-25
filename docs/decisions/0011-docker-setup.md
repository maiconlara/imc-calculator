# 0011. Docker setup

- Status: accepted
- Date: 2026-11-24

## Context

The requirements ask for Docker as a bonus. Someone trying the project should be able to run the API and the panel with only Docker installed, without Node.js or pnpm, and the images must follow the same rules as the code: pinned versions ([decision 0007](0007-pinned-versions.md)), the dependency guards ([decision 0008](0008-dependency-supply-chain-guards.md)) and the session in `httpOnly` cookies ([decision 0005](0005-session-in-httponly-cookies.md)).

Three things got in the way:

- The API refuses the sample token secret in production, so a fresh `docker compose up` would need a secret before anything ran.
- The system has no sign-up. Only the demo seed creates the first administrator, and the seed refuses `NODE_ENV=production` because it deletes every row.
- `pino-pretty` is a development dependency, and the logger loaded it whenever `NODE_ENV=development`.

## Decision

- One multi-stage `Dockerfile` at the root builds both images: the `api` target and the `panel` target. The base image is pinned by tag and digest, pnpm comes from `packageManager`, and dependencies are installed with `--frozen-lockfile`: exactly the versions of the lockfile, which was resolved under the release age guard, with the install script and agent skill rules of `pnpm-workspace.yaml` applied inside the build too.
- Both images run in production mode as the unprivileged `node` user. The API image holds the bundled `dist` and only its production dependencies. The panel image holds the Next.js standalone server, turned on only in the image build (`NEXT_BUILD_OUTPUT=standalone`) so `next start` keeps working outside Docker.
- `compose.yaml` publishes only the panel, on `127.0.0.1`. The API answers only inside the Compose network, which is why `TRUST_PROXY` trusts the private address ranges.
- The API applies the migrations on every start. When `JWT_ACCESS_SECRET` is not set, it generates a random secret on the first start and keeps it next to the database in the `api-data` volume.
- The demo gym comes from a `seed` service in the `seed` profile, run once with `docker compose --profile seed run --rm seed` (the explicit profile is what podman-compose needs, and Docker Compose accepts it). It uses the API image with `NODE_ENV=development`, the explicit sign that this database is a demo. Without `pino-pretty`, the logger falls back to JSON.
- The CI builds both images, creates the demo gym, starts them and signs in through the panel, so a broken image shows up as a failed `Docker images` check on the pull request.

## Consequences

- `docker compose --profile seed run --rm seed` followed by `docker compose up --build --detach` gives a working system with the demo logins.
- In production mode the session cookies are `Secure`, and browsers accept them over plain HTTP only on `localhost`. A deployment for real users needs a reverse proxy with HTTPS in front of the panel, counted in `TRUSTED_PROXY_COUNT` as [decision 0009](0009-visitor-address-on-login.md) describes.
- Without such a proxy, every login reaches the API from the panel container, so the failed login limit works per username for everyone, as decision 0009 already says for development.
- SQLite in a volume means a single API container. Running several would need another database.
- Deleting the volume deletes the generated secret, which signs out every session, along with the data.
- Each pull request spends a few more minutes in the CI building the images.
