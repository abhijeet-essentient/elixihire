/**
 * Access-gate configuration, kept free of 'use client' so the root layout can read it
 * too — the pre-paint inline script in the layout must use the same storage key and
 * session token as the provider, or a signed-in viewer would see the login screen flash
 * on every navigation.
 *
 * Credentials come from build-time environment variables. See `.env.example`.
 *
 * This gate FAILS CLOSED. A production build with no credential configured lets nobody
 * in at all, rather than falling back to a default that is committed to this repository
 * and would therefore be readable by anyone with the source. The convenience fallback
 * below exists only under `next dev`, where `process.env.NODE_ENV` is 'development';
 * Next inlines that constant at build time, so the literal is unreachable — and, after
 * minification, absent — in a production bundle.
 */

export const CONFIGURED_USERNAME = process.env.NEXT_PUBLIC_DEMO_USERNAME?.trim() || 'essentient';
export const CONFIGURED_HASH =
  process.env.NEXT_PUBLIC_DEMO_PASSWORD_SHA256?.trim().toLowerCase() || '';
export const CONFIGURED_PLAINTEXT = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? '';

/** Local-development convenience only. Never reachable in a production build. */
export const DEV_FALLBACK_PASSWORD =
  process.env.NODE_ENV === 'development' ? 'local-dev-only' : '';

export const ACCESS_CONTACT = 'contact@essentient.co';

export const STORAGE_KEY = 'elixihire-demo-access';

/** How the running build is configured. Surfaced on the login screen. */
export type CredentialSource = 'hash' | 'plaintext' | 'dev' | 'unconfigured';

export const credentialSource: CredentialSource = CONFIGURED_HASH
  ? 'hash'
  : CONFIGURED_PLAINTEXT
    ? 'plaintext'
    : DEV_FALLBACK_PASSWORD
      ? 'dev'
      : 'unconfigured';

/** True when a production build has no credential and so admits nobody. */
export const gateUnconfigured = credentialSource === 'unconfigured';

/** Small non-cryptographic fingerprint. Only used to version sessions, never to verify. */
function fingerprint(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}

/**
 * Sessions are tied to the credential in force when they were created, so rotating the
 * password immediately invalidates every session that used the old one — including any
 * created while a deployment was misconfigured. Bump the prefix to force everyone out
 * without changing the password.
 */
export const SESSION_TOKEN =
  credentialSource === 'unconfigured'
    ? 'none'
    : `v2-${fingerprint(`${CONFIGURED_USERNAME}:${CONFIGURED_HASH || CONFIGURED_PLAINTEXT || DEV_FALLBACK_PASSWORD}`)}`;
