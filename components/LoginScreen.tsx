'use client';

import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { DemoBadge } from './DemoBadge';
import { ElixiHireLogo, EssentientLogo } from './Logos';
import { Button, Field } from './ui';
import { ACCESS_CONTACT, useAuth } from '@/lib/auth';

/**
 * The gate. Stands alone — no navigation, no persona switcher, nothing from the demo
 * behind it — so the locked state is unmistakable and the pre-rendered HTML of every
 * route contains only this.
 */
export function LoginScreen({ prehydration = false }: { prehydration?: boolean }) {
  const { signIn, username: configuredUsername, credentialSource } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');

    // A deliberate pause, growing with failed attempts. It will not stop anyone
    // determined — nothing client-side can — but it makes casual guessing tedious.
    const penalty = Math.min(attempts, 5) * 400;
    if (penalty > 0) await new Promise((resolve) => window.setTimeout(resolve, penalty));

    const result = await signIn(username, password);

    if (!result.ok) {
      setAttempts((n) => n + 1);
      setPassword('');
      setError(
        result.reason === 'unavailable'
          ? 'This browser cannot verify the credential here. Open the demo over https (or on localhost) and try again.'
          : 'That username and password combination is not recognised.',
      );
    }
    setBusy(false);
  };

  return (
    <div
      // When true this copy is the pre-hydration one, hidden before paint if the
      // viewer already has a session. See the rule in globals.css.
      data-auth-prehydration={prehydration ? 'true' : undefined}
      className="flex min-h-screen flex-col bg-surface"
    >
      <div className="bg-banner px-4 py-1.5 text-center text-[11px] font-medium tracking-wide text-banner-fg/90">
        DEMO · illustrative only — no live data. Access is restricted.
      </div>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          <div className="flex flex-col items-center text-center">
            <ElixiHireLogo />
            <DemoBadge className="mt-4" />
          </div>

          <div className="card mt-6 p-6">
            <h1 className="flex items-center gap-2 font-serif text-xl text-slate-ink">
              <Lock aria-hidden="true" className="h-4 w-4 text-jade" />
              Restricted demo
            </h1>
            <p className="mt-2 text-sm text-body">
              This interactive demo is shared privately with named reviewers. Please sign in with
              the credentials you were given.
            </p>

            <noscript>
              <p className="mt-4 rounded-lg border border-warn-border bg-warn-bg px-3 py-2 text-sm text-warn-fg">
                This demo needs JavaScript to run. Please enable it, or get in touch at the address
                below.
              </p>
            </noscript>

            <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
              <Field label="Username" htmlFor="login-username">
                <input
                  id="login-username"
                  className="input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                />
              </Field>

              <Field label="Password" htmlFor="login-password">
                <div className="relative">
                  <input
                    id="login-password"
                    type={reveal ? 'text' : 'password'}
                    className="input pr-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setReveal((r) => !r)}
                    aria-label={reveal ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 flex items-center rounded-r-lg px-3 text-muted transition-colors hover:text-slate-ink"
                  >
                    {reveal ? (
                      <EyeOff aria-hidden="true" className="h-4 w-4" />
                    ) : (
                      <Eye aria-hidden="true" className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </Field>

              {error ? (
                <p
                  role="alert"
                  className="rounded-lg border border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger-fg"
                >
                  {error}
                </p>
              ) : null}

              <Button type="submit" className="w-full" disabled={busy || !username || !password}>
                {busy ? 'Checking…' : 'Enter the demo'}
              </Button>
            </form>

            <div className="mt-5 rounded-lg border border-hairline bg-jade-tint/60 px-3 py-3">
              <p className="flex items-start gap-2 text-sm text-body">
                <Mail aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                <span>
                  This is a restricted demo. If you would like access, please contact the
                  administrator at{' '}
                  <a
                    href={`mailto:${ACCESS_CONTACT}?subject=ElixiHire%20demo%20access%20request`}
                    className="rounded font-medium text-jade-dark underline underline-offset-2 hover:text-jade"
                  >
                    {ACCESS_CONTACT}
                  </a>
                  .
                </span>
              </p>
            </div>

            {credentialSource === 'fallback' ? (
              <p className="mt-4 flex items-start gap-2 rounded-lg border border-warn-border bg-warn-bg px-3 py-2 text-xs text-warn-fg">
                <TriangleAlert aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  <strong>This deployment has no credential configured</strong> and is using the
                  built-in development default. Set{' '}
                  <code className="font-mono">NEXT_PUBLIC_DEMO_PASSWORD_SHA256</code> in the Vercel
                  project settings and redeploy. The expected username is{' '}
                  <code className="font-mono">{configuredUsername}</code>.
                </span>
              </p>
            ) : null}

            {credentialSource === 'plaintext' ? (
              <p className="mt-4 flex items-start gap-2 rounded-lg border border-warn-border bg-warn-bg px-3 py-2 text-xs text-warn-fg">
                <TriangleAlert aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  Configured with a plaintext password, which is readable in the deployed bundle.
                  Prefer <code className="font-mono">NEXT_PUBLIC_DEMO_PASSWORD_SHA256</code>.
                </span>
              </p>
            ) : null}
          </div>

          <p className="mt-5 text-center text-xs text-muted">
            Nothing in this demo is a real person, organisation or vacancy, and no credential you
            type here is sent anywhere — the check runs entirely in your browser.
          </p>
        </motion.div>
      </main>

      <footer className="border-t border-hairline bg-jade-tint/40">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3 px-4 py-6 text-center">
          <EssentientLogo />
          <p className="text-xs text-muted">
            A demo by Essentient™ · front-end only, not the working product ·{' '}
            <a
              href="https://essentient.co"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded font-medium text-jade-dark underline underline-offset-2 hover:text-jade"
            >
              essentient.co
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
