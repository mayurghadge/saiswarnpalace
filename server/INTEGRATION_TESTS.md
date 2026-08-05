Integration tests and CI

This project includes an end-to-end integration test that exercises the refresh-token and logout flows against a real SQL Server instance.

Files
- `tests/integration/e2e.refreshLogout.test.js` — E2E test that can optionally start docker-compose, creates a dedicated test database, runs migrations, and tears down the DB.
- `docker-compose.test.yml` — Docker Compose file providing a SQL Server instance for local runs.
- `.github/workflows/integration-tests.yml` — GitHub Actions workflow that runs the integration test in CI.

NPM scripts (in `server/package.json`)
- `npm run test:integration` — run the E2E test (expects DB env vars set by CI or local environment)
- `npm run test:integration:compose` — convenience script that runs the E2E test and brings up `docker-compose.test.yml` (locally)
- `npm run test:integration:ci` — script intended for CI to run the E2E test (same as `test:integration`)

Required environment variables for CI or local runs
- `DB_SERVER` — hostname of SQL Server (CI: `mssql` service)
- `DB_PORT` — port (default: `1433`)
- `DB_USER` — DB user (CI: `sa`)
- `DB_PASSWORD` — SA password (must be provided as a secret in CI)
- `TEST_DB_NAME` — name for the dedicated test database (the test will create and drop it)
- `JWT_SECRET` — secret used to sign access tokens
- Optional: `USE_DOCKER_COMPOSE=true` to let the test start/stop the local docker-compose stack

CI setup (GitHub Actions)
1. Add repository secret `MSSQL_SA_PASSWORD` containing the SA password.
2. The included workflow `.github/workflows/integration-tests.yml` reads the secret and runs the integration job across Node 16/18/20.

Create secret via GitHub API (optional automation)

You can create the repository secret from your machine using the script at `server/scripts/create_github_secret.js`.

Usage:

```bash
# Install dev deps first
cd server
npm install

# Then run the script (replace placeholders):
node scripts/create_github_secret.js <OWNER> <REPO> MSSQL_SA_PASSWORD "Your_strong!Passw0rd" <GITHUB_PAT>
```

The script does the public-key fetch + encryption and creates the Actions secret. The PAT should have `repo` scope.

Or use cURL (manual, requires additional steps to encrypt with the repo public key):

1. Fetch the public key:

```bash
curl -H "Authorization: token <GITHUB_PAT>" \
	https://api.github.com/repos/<OWNER>/<REPO>/actions/secrets/public-key
```

2. Use a tool like `tweetsodium` locally to encrypt the secret using the returned `key` (base64), then PUT it to `/actions/secrets/<name>`.

Security reminder: DO NOT commit tokens or plaintext secrets into the repo.

Using the workflow dispatch to set the secret

If you prefer to set the secret from the GitHub UI without running the script locally, you can use the included workflow `/.github/workflows/setup-secrets.yml`:

1. Create a repository secret named `GITHUB_SETUP_PAT` that contains a GitHub Personal Access Token (PAT) with `repo` scope.
2. In the Actions tab, select `Setup Repository Secrets` and run the workflow. Provide the SA password when prompted in the Dispatch form.

Note: the workflow will use the PAT from `secrets.GITHUB_SETUP_PAT` to call the GitHub API and create `MSSQL_SA_PASSWORD`.

Security notes
- Never commit real credentials. Use repository secrets in GitHub Actions.
- The test creates and drops a database named by `TEST_DB_NAME`. Use a dedicated test database name to avoid impacting production data.
- Protect the integration workflow with branch protection and require approvals before merging changes that affect tests or CI configuration.
- Limit who can run the secret setup workflow by assigning `GITHUB_SETUP_PAT` only to an admin team or a small trusted maintainer group.

Branch protection guidance
- Enable required status checks for the `integration-tests.yml` workflow on protected branches.
- Require pull request reviews before merging, and optionally require review from code owners.
- Restrict who can push to protected branches to a GitHub Team or specific maintainers.
- Use GitHub Teams and role-based access to ensure only trusted members can modify CI, secrets, or protected branch settings.

Troubleshooting
- If the test times out waiting for the DB, increase the `waitForPort` timeout in the test or allow more retries in CI healthchecks.
- On Windows, ensure Docker and `docker-compose` are available in PATH for `test:integration:compose`.
