#!/usr/bin/env node
// Usage: node create_github_secret.js <owner> <repo> <secret_name> <secret_value> <GITHUB_PAT>
// This script requests the repo public key, encrypts the secret, and creates/updates the Actions secret.

const fetch = globalThis.fetch || require('node-fetch');
const sodium = require('tweetsodium');

async function createSecret(owner, repo, name, value, pat) {
  const apiBase = `https://api.github.com/repos/${owner}/${repo}`;

  // 1) get public key
  const keyRes = await fetch(`${apiBase}/actions/secrets/public-key`, {
    headers: { Authorization: `token ${pat}`, Accept: 'application/vnd.github+json' }
  });
  if (!keyRes.ok) throw new Error(`Failed to fetch public key: ${keyRes.status} ${await keyRes.text()}`);
  const keyJson = await keyRes.json();

  // 2) encrypt the secret value using the public key
  const messageBytes = Buffer.from(value);
  const keyBytes = Buffer.from(keyJson.key, 'base64');
  const encryptedBytes = sodium.seal(messageBytes, keyBytes);
  const encryptedValue = Buffer.from(encryptedBytes).toString('base64');

  // 3) PUT secret
  const putRes = await fetch(`${apiBase}/actions/secrets/${encodeURIComponent(name)}`, {
    method: 'PUT',
    headers: { Authorization: `token ${pat}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ encrypted_value: encryptedValue, key_id: keyJson.key_id })
  });

  if (!putRes.ok) throw new Error(`Failed to create secret: ${putRes.status} ${await putRes.text()}`);
  return true;
}

async function main() {
  const [owner, repo, name, value, pat] = process.argv.slice(2);
  if (!owner || !repo || !name || !value || !pat) {
    console.error('Usage: node create_github_secret.js <owner> <repo> <secret_name> <secret_value> <GITHUB_PAT>');
    process.exit(2);
  }

  try {
    await createSecret(owner, repo, name, value, pat);
    console.log('Secret created/updated successfully');
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
}

if (require.main === module) main();
