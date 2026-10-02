#!/usr/bin/env node
/**
 * Generates the SHA-256 hash to put in NEXT_PUBLIC_DEMO_PASSWORD_SHA256.
 *
 * Usage:  npm run hash-password -- 'the password you want'
 *
 * Storing the hash rather than the password keeps the plaintext out of the deployed
 * bundle. It does not make the gate secure — see the note in the README — but it does
 * mean reading the bundle will not hand someone the password.
 */
import { createHash } from 'node:crypto';

const password = process.argv.slice(2).join(' ');

if (!password) {
  console.error('Usage: npm run hash-password -- \'your-password\'');
  process.exit(1);
}

if (password.length < 10) {
  console.error(
    `Refusing: that password is ${password.length} characters. Use at least 10 — the hash is\n` +
      'public in the bundle, so a short password can be brute-forced offline in seconds.',
  );
  process.exit(1);
}

const hash = createHash('sha256').update(password, 'utf8').digest('hex');

console.log('\nSet these in your Vercel project settings (Settings → Environment Variables),');
console.log('then redeploy — these are read at build time, not at run time:\n');
console.log(`  NEXT_PUBLIC_DEMO_PASSWORD_SHA256=${hash}`);
console.log('  NEXT_PUBLIC_DEMO_USERNAME=essentient\n');
console.log('Share the username and password with reviewers out of band, not in the repo.\n');
