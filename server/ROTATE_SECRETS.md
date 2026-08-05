# Secret Rotation & Remediation

This document lists immediate actions and commands to rotate leaked secrets (DB, Cloudinary, JWT_SECRET, admin password) and to remediate repository exposure.

IMPORTANT: You must perform the external rotations (Cloudinary, database, hosting provider) from their respective consoles — this repository cannot rotate external secrets for you.

## 1) High-level checklist (do these first)

- Revoke and rotate:
  - Database credentials (SA or DB user)
  - Cloudinary API key & secret
  - Any OAuth / third-party API keys
  - `JWT_SECRET`
  - Admin user password(s)
- Remove any plain-text secrets from repo (already removed from tracked files).
- Replace secrets in deployment environment (Vercel, Azure, GitHub Actions secrets).
- Invalidate sessions & refresh tokens in database.
- If secrets were committed to Git history, remove them from history (see section below).

## 2) Generate strong secrets locally

- Generate a 256-bit random JWT secret (hex):

```bash
# Linux / macOS / WSL / Git Bash
openssl rand -hex 64

# Alternatively using node
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

- Generate a new DB password and Cloudinary secret using a password manager or `openssl rand -base64 32`.

## 3) Rotate Database credentials

- For MS SQL (example for `sa`):
  - Log in to your cloud SQL admin panel or run on the server and change the password.
  - Update deployment environment variables (GitHub Actions / Vercel / Azure) with the new `DB_PASSWORD`.

- After updating deployment variables, restart your app so new credentials are used.

- Optional: create a new DB user with the minimal required privileges and rotate app to use it instead of `sa`.

## 4) Rotate Cloudinary keys

- In the Cloudinary dashboard: revoke the old API key & secret and create new credentials.
- Update `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, and `CLOUDINARY_CLOUD_NAME` in your hosting provider secrets.

## 5) Rotate JWT secret and revoke tokens

1. Generate a new `JWT_SECRET` as shown above.
2. Update the `JWT_SECRET` in your deployment environment.
3. To immediately invalidate existing JWT access tokens and refresh tokens:
   - If you use refresh token rotation + database storage, delete all existing refresh token records in the `RefreshTokens` table.
   - Optionally implement a token version or `jwtVersion` field on users; bumping the value will invalidate tokens issued with the old version.

Example SQL to remove refresh tokens (replace table name if different):

```sql
DELETE FROM RefreshTokens;
```

Note: Removing all refresh tokens will force everyone to re-login.

## 6) Reset Admin Password(s)

- Choose a strong password and store it in your secrets manager.
- If admins are stored in a `Users` or `Admins` table, update the password hash using bcrypt.

Node script example to produce a bcrypt hash (run locally):

```bash
node -e "console.log(require('bcryptjs').hashSync(process.argv[1], 12))" 'YourNewStrongPasswordHere'
```

Then run an SQL update (example):

```sql
UPDATE Users
SET password = '<bcrypt-hash>'
WHERE email = 'admin@saiswarnpalace';
```

Alternatively, create a one-off admin user via an admin-only migration or DB script.

## 7) Update hosting / CI secrets

- Update GitHub repository secrets (Settings > Secrets) for CI and workflows: `MSSQL_SA_PASSWORD`, `DB_PASSWORD`, `JWT_SECRET`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, etc.
- Update Vercel / Azure / whichever host environment variables.
- Verify deployments use the new values and restart services.

## 8) Invalidate sessions & revoke refresh tokens in-app

- Option 1: Add a maintenance endpoint to revoke tokens (authenticated) and call it once.
- Option 2: Delete refresh tokens from DB as shown above.
- Option 3: Add a `tokenVersion` column on `Users` and increment it to invalidate JWTs issued before the bump.

## 9) Search repo and Git history for leaked secrets

- Search working tree for common keywords:

```bash
grep -R "CLOUDINARY_API_SECRET\|JWT_SECRET\|MSSQL_SA_PASSWORD\|admin@saiswarnpalace" -n ..
```

- If secrets were committed in past commits, remove them from history (use with care):
  - Use `git filter-repo` or the BFG Repo-Cleaner to remove secrets from history.
  - Example (BFG):

```bash
# Install BFG, then:
java -jar bfg.jar --delete-files id_rsa
# or replace text across history
java -jar bfg.jar --replace-text passwords.txt
```

See: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository

## 10) Post-rotation validation

- Confirm the app can connect to the DB with new credentials locally.
- Confirm uploads to Cloudinary work using new credentials.
- Confirm new JWT_SECRET signs and verifies tokens; test login and refresh flows.
- Run test suite: `cd server && npm test`.

## 11) Emergency rollback plan

- If rotation causes service disruption, you can temporarily restore previous env values in the hosting provider while investigating.
- Immediately audit who had access to the leaked secret and rotate personal credentials where relevant.

## 12) Notes and reminders

- Never store production secrets in plaintext in repo.
- Add a pre-commit hook to prevent committing `.env` and other secret files.
- Consider using a secrets manager (GitHub Secrets, HashiCorp Vault, AWS Secrets Manager, Azure Key Vault) for production secrets.

---
If you'd like, I can:
- Add a database script to reset admin password safely,
- Add a small endpoint that clears refresh tokens (protected by admin auth), or
- Run the test suite now to verify the server after the CSRF changes.

Tell me which of these you'd like me to do next.