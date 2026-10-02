/**
 * Access-gate configuration, kept free of 'use client' so the root layout can read it
 * too — the pre-paint inline script in the layout must use the same storage key and
 * session version as the provider, or a signed-in viewer would see the login screen
 * flash on every navigation.
 *
 * Credentials come from build-time environment variables. See `.env.example`.
 */

export const CONFIGURED_USERNAME = process.env.NEXT_PUBLIC_DEMO_USERNAME?.trim() || 'essentient';
export const CONFIGURED_HASH =
  process.env.NEXT_PUBLIC_DEMO_PASSWORD_SHA256?.trim().toLowerCase() || '';
export const CONFIGURED_PLAINTEXT = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? '';

/** Used only when nothing is configured, so a fresh clone runs. Never ship with this. */
export const FALLBACK_PASSWORD = 'elixihire-demo';

export const ACCESS_CONTACT = 'contact@essentient.co';

export const STORAGE_KEY = 'elixihire-demo-access';
/** Bump to invalidate every existing session, e.g. after rotating the password. */
export const SESSION_TOKEN_VERSION = 'v1';

/** How the running build is configured — surfaced on the login screen. */
export type CredentialSource = 'hash' | 'plaintext' | 'fallback';

export const credentialSource: CredentialSource = CONFIGURED_HASH
  ? 'hash'
  : CONFIGURED_PLAINTEXT
    ? 'plaintext'
    : 'fallback';
