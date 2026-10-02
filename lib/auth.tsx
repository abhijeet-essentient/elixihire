'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/**
 * Access gate for the demo.
 *
 * IMPORTANT — what this is and is not.
 *
 * This site is a static export with no server, so the credential check necessarily runs
 * in the visitor's browser. That makes this a *deterrent*, not access control: it stops
 * someone who stumbles on the URL from reading the demo, but anyone who opens dev tools
 * can read the JS bundle (including the seed data) or skip the gate entirely.
 *
 * Two things are done to make it as sound as a static site allows:
 *
 *  1. The configured credential is compared as a SHA-256 hash, so the plaintext password
 *     never appears in the deployed bundle. (A plaintext variable is still supported for
 *     convenience, and the UI says so when one is in use.)
 *  2. The gate renders *instead of* the page, not over it, so the pre-rendered HTML of
 *     every route contains the login screen rather than the screen's content.
 *
 * For genuine protection, put Vercel's Deployment Protection in front of the deployment —
 * that gates at the edge, before any file is served. See the README.
 */

import {
  CONFIGURED_HASH,
  CONFIGURED_PLAINTEXT,
  CONFIGURED_USERNAME,
  DEV_FALLBACK_PASSWORD,
  SESSION_TOKEN,
  STORAGE_KEY,
  credentialSource,
  gateUnconfigured,
  type CredentialSource,
} from './authConfig';

export { ACCESS_CONTACT, credentialSource, gateUnconfigured } from './authConfig';
export type { CredentialSource } from './authConfig';

async function sha256Hex(input: string): Promise<string | null> {
  // crypto.subtle needs a secure context (https, or localhost). Opening the built
  // files over file:// or plain http on a LAN address will not have it.
  if (typeof crypto === 'undefined' || !crypto.subtle) return null;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export type SignInResult =
  | { ok: true }
  | { ok: false; reason: 'wrong' | 'unavailable' | 'unconfigured' };

interface AuthContextValue {
  /** True once the viewer has signed in during this tab's session. */
  authed: boolean;
  /** False until the stored session has been read, so nothing flashes on first paint. */
  checked: boolean;
  signIn: (username: string, password: string) => Promise<SignInResult>;
  signOut: () => void;
  username: string;
  credentialSource: CredentialSource;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [checked, setChecked] = useState(false);

  // Restore after mount only. Reading storage during render would desync the
  // pre-rendered markup, and the pre-render must always be the locked state.
  useEffect(() => {
    try {
      // Never honour a stored session when nothing is configured.
      setAuthed(
        !gateUnconfigured && window.sessionStorage.getItem(STORAGE_KEY) === SESSION_TOKEN,
      );
    } catch {
      // Blocked storage — the viewer simply signs in again.
    }
    setChecked(true);
  }, []);

  const signIn = useCallback(async (user: string, password: string): Promise<SignInResult> => {
    // Fail closed: with nothing configured there is no credential to match, so nobody
    // gets in. The alternative — a default baked into the source — would mean an
    // unconfigured deployment was open to anyone who read this repository.
    if (gateUnconfigured) return { ok: false, reason: 'unconfigured' };

    const userOk = user.trim().toLowerCase() === CONFIGURED_USERNAME.toLowerCase();

    let passwordOk = false;
    if (credentialSource === 'hash') {
      const hashed = await sha256Hex(password);
      if (hashed === null) return { ok: false, reason: 'unavailable' };
      passwordOk = hashed === CONFIGURED_HASH;
    } else if (credentialSource === 'plaintext') {
      passwordOk = password === CONFIGURED_PLAINTEXT;
    } else {
      passwordOk = DEV_FALLBACK_PASSWORD !== '' && password === DEV_FALLBACK_PASSWORD;
    }

    // Both halves are checked before answering, so a wrong username and a wrong
    // password are indistinguishable from the outside.
    if (!userOk || !passwordOk) return { ok: false, reason: 'wrong' };

    setAuthed(true);
    // Keep the document marker in step with the session, so a reload is paint-clean.
    document.documentElement.dataset.access = 'granted';
    try {
      window.sessionStorage.setItem(STORAGE_KEY, SESSION_TOKEN);
    } catch {
      // Access still works for this page view; it just will not survive a reload.
    }
    return { ok: true };
  }, []);

  const signOut = useCallback(() => {
    setAuthed(false);
    delete document.documentElement.dataset.access;
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing to clear.
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ authed, checked, signIn, signOut, username: CONFIGURED_USERNAME, credentialSource }),
    [authed, checked, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
