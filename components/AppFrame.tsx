'use client';

import { PlayCircle, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { CommandPalette } from './CommandPalette';
import { DemoBadge } from './DemoBadge';
import { GuidedTour, useTourController } from './GuidedTour';
import { ElixiHireLogo, EssentientLogo } from './Logos';
import { NAV, ROLE_LABEL, navItemFor, roleFromPath } from './nav';
import { RoleSwitcher } from './RoleSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { TierBadge } from './TierBadge';
import { Toasts } from './Toasts';
import { Button } from './ui';
import { useDemo } from '@/lib/store';

/**
 * The persistent shell: branding, demo badge, persona switcher, scoped nav, command
 * palette, guided tour, theme toggle and footer. Every page renders inside it, so the
 * demo disclosure and the Core/Preview tier are never more than a glance away.
 */
export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/';
  const role = roleFromPath(pathname);
  const { setRole, resetDemo } = useDemo();
  const tour = useTourController();

  // The URL is the source of truth for the persona; keep the store in step with it.
  useEffect(() => {
    if (role) setRole(role);
  }, [role, setRole]);

  const nav = role ? NAV[role] : [];
  const current = navItemFor(pathname);

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[80]
                   focus:rounded-lg focus:bg-jade focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>

      <div className="bg-banner px-4 py-1.5 text-center text-[11px] font-medium tracking-wide text-banner-fg/90">
        DEMO · illustrative only — no live data. Nothing here is a real person, organisation or vacancy.
      </div>

      <header className="sticky top-0 z-40 border-b border-hairline bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="rounded-lg" aria-label="ElixiHire demo home">
            <ElixiHireLogo />
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <DemoBadge className="hidden xl:inline-flex" />
            <SearchHint />
            <Button
              size="sm"
              variant="secondary"
              onClick={tour.start}
              data-tour="tour-button"
              className="hidden sm:inline-flex"
            >
              <PlayCircle aria-hidden="true" className="h-3.5 w-3.5" />
              Take the tour
            </Button>
            <RoleSwitcher active={role} />
            <ThemeToggle />
            <ResetButton onReset={resetDemo} />
          </div>
        </div>

        {nav.length > 0 ? (
          <nav
            aria-label={`${role ? ROLE_LABEL[role] : ''} navigation`}
            className="border-t border-hairline bg-jade-tint/50 lg:hidden"
          >
            <ul className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 py-2">
              {nav.map((item) => (
                <li key={item.href}>
                  <NavLink item={item} pathname={pathname} compact />
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-4 py-6 sm:py-8">
        {nav.length > 0 ? (
          <nav
            aria-label={`${role ? ROLE_LABEL[role] : ''} navigation`}
            className="hidden w-60 shrink-0 lg:block"
          >
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
              {role ? ROLE_LABEL[role] : ''}
            </p>
            <ul className="space-y-1">
              {nav.map((item) => (
                <li key={item.href}>
                  <NavLink item={item} pathname={pathname} />
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <main id="main" className="min-w-0 flex-1">
          {current ? (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <TierBadge tier={current.tier} phase={current.phase} />
              <span className="text-xs text-muted">{current.blurb}</span>
            </div>
          ) : null}
          {children}
        </main>
      </div>

      <footer className="border-t border-hairline bg-jade-tint/40">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-6">
          <div className="flex flex-wrap items-center gap-3">
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
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/about/" className="rounded text-xs text-muted underline-offset-2 hover:underline">
              About this demo
            </Link>
            <Link href="/roadmap/" className="rounded text-xs text-muted underline-offset-2 hover:underline">
              Roadmap
            </Link>
            <DemoBadge />
          </div>
        </div>
      </footer>

      <CommandPalette onStartTour={tour.start} />
      <GuidedTour step={tour.step} setStep={tour.setStep} stop={tour.stop} />
      <Toasts />
    </div>
  );
}

/** A non-interactive affordance telling people the palette exists. */
function SearchHint() {
  const [mac, setMac] = useState(false);
  useEffect(() => {
    setMac(/Mac|iPhone|iPad/.test(navigator.platform ?? ''));
  }, []);

  return (
    <button
      type="button"
      onClick={() =>
        document.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }),
        )
      }
      className="hidden items-center gap-2 rounded-lg border border-hairline px-2.5 py-1.5 text-xs text-muted
                 transition-colors hover:bg-jade-tint hover:text-slate-ink md:inline-flex"
    >
      <Search aria-hidden="true" className="h-3.5 w-3.5" />
      Search
      <kbd className="rounded border border-hairline px-1 py-px text-[10px]">
        {mac ? '⌘' : 'Ctrl'} K
      </kbd>
    </button>
  );
}

function NavLink({
  item,
  pathname,
  compact = false,
}: {
  item: (typeof NAV)['employer'][number];
  pathname: string;
  compact?: boolean;
}) {
  const isActive = pathname === item.href || pathname === item.href.replace(/\/$/, '');
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={isActive ? 'page' : undefined}
      title={item.blurb}
      className={`flex items-center gap-2 whitespace-nowrap rounded-lg text-sm transition-colors ${
        compact ? 'px-3 py-1.5' : 'px-3 py-2'
      } ${isActive ? 'bg-jade text-white' : 'text-body hover:bg-jade-tint hover:text-jade-dark'}`}
    >
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
      <span className="flex-1">{item.label}</span>
      {item.tier === 'preview' ? (
        <span
          aria-label="Preview capability"
          title={`Preview — roadmap phase ${item.phase}`}
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${isActive ? 'bg-white/80' : 'bg-warn-fg'}`}
        />
      ) : null}
    </Link>
  );
}

/** Two-step so a stray click cannot wipe a demo mid-walkthrough. */
function ResetButton({ onReset }: { onReset: () => void }) {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const timer = window.setTimeout(() => setConfirming(false), 4000);
    return () => window.clearTimeout(timer);
  }, [confirming]);

  if (confirming) {
    return (
      <span className="flex items-center gap-1.5">
        <Button
          size="sm"
          variant="danger"
          onClick={() => {
            onReset();
            setConfirming(false);
          }}
        >
          Confirm reset
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </span>
    );
  }

  return (
    <Button size="sm" variant="ghost" onClick={() => setConfirming(true)} title="Restore seed data">
      Reset demo
    </Button>
  );
}
