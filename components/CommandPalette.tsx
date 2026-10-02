'use client';

import { Command } from 'cmdk';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BriefcaseBusiness,
  LogOut,
  Moon,
  PlayCircle,
  RotateCcw,
  Sun,
  UserRound,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { GLOBAL_PAGES, NAV, ROLE_LABEL } from './nav';
import { useAuth } from '@/lib/auth';
import { maskedName } from '@/lib/mask';
import { useDemo } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import type { Role } from '@/lib/types';

/**
 * ⌘K / Ctrl-K palette: jump to any screen in any persona, find a job or candidate, or
 * run a demo action. It is the fastest way to show breadth in a live walkthrough.
 */
export function CommandPalette({ onStartTour }: { onStartTour: () => void }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { jobs, candidates, resetDemo, setRole } = useDemo();
  const { theme, toggle } = useTheme();
  const { signOut } = useAuth();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const run = useCallback((action: () => void) => {
    setOpen(false);
    // Let the dialog close before the route changes, so the transition is not janky.
    window.setTimeout(action, 10);
  }, []);

  const go = useCallback(
    (href: string, role?: Role) => run(() => {
      if (role) setRole(role);
      router.push(href);
    }),
    [run, router, setRole],
  );

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[12vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="absolute inset-0 bg-slate-ink/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-hairline bg-surface-raised shadow-pop"
          >
            <Command label="Command palette" className="flex max-h-[60vh] flex-col">
              <Command.Input
                autoFocus
                placeholder="Search screens, jobs, candidates, actions…"
                className="w-full border-b border-hairline bg-transparent px-4 py-3.5 text-sm text-body outline-none placeholder:text-muted"
              />
              <Command.List className="min-h-0 flex-1 overflow-y-auto p-2">
                <Command.Empty className="px-3 py-8 text-center text-sm text-muted">
                  Nothing matches that.
                </Command.Empty>

                <Command.Group heading="Actions" className="cmd-group">
                  <Item onSelect={() => run(onStartTour)} icon={<PlayCircle className="h-4 w-4" />}>
                    Take the guided tour
                  </Item>
                  <Item onSelect={() => run(toggle)} icon={theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}>
                    Switch to {theme === 'dark' ? 'light' : 'dark'} theme
                  </Item>
                  <Item onSelect={() => run(resetDemo)} icon={<RotateCcw className="h-4 w-4" />}>
                    Reset demo data
                  </Item>
                  <Item onSelect={() => run(signOut)} icon={<LogOut className="h-4 w-4" />}>
                    Sign out of the demo
                  </Item>
                </Command.Group>

                {(Object.keys(NAV) as Role[]).map((role) => (
                  <Command.Group key={role} heading={`${ROLE_LABEL[role]} screens`} className="cmd-group">
                    {NAV[role].map((item) => (
                      <Item
                        key={item.href}
                        onSelect={() => go(item.href, role)}
                        icon={<item.icon className="h-4 w-4" />}
                        hint={item.tier === 'preview' ? 'Preview' : undefined}
                      >
                        {item.label}
                      </Item>
                    ))}
                  </Command.Group>
                ))}

                <Command.Group heading="About" className="cmd-group">
                  {GLOBAL_PAGES.map((item) => (
                    <Item key={item.href} onSelect={() => go(item.href)} icon={<item.icon className="h-4 w-4" />}>
                      {item.label}
                    </Item>
                  ))}
                </Command.Group>

                <Command.Group heading="Jobs" className="cmd-group">
                  {jobs.slice(0, 12).map((job) => (
                    <Item
                      key={job.id}
                      value={`job ${job.title} ${job.specialty} ${job.location}`}
                      onSelect={() => go(`/employer/applicants/?job=${job.id}`, 'employer')}
                      icon={<BriefcaseBusiness className="h-4 w-4" />}
                      hint={job.location}
                    >
                      {job.title}
                    </Item>
                  ))}
                </Command.Group>

                <Command.Group heading="Candidates (masked)" className="cmd-group">
                  {candidates.slice(0, 12).map((candidate) => (
                    <Item
                      key={candidate.id}
                      value={`candidate ${maskedName(candidate.fullName)} ${candidate.roleType} ${candidate.specialties
                        .map((s) => s.specialty)
                        .join(' ')}`}
                      onSelect={() => go('/employer/applicants/', 'employer')}
                      icon={<UserRound className="h-4 w-4" />}
                      hint={candidate.roleType}
                    >
                      {maskedName(candidate.fullName)} — {candidate.headline}
                    </Item>
                  ))}
                </Command.Group>
              </Command.List>

              <footer className="flex items-center justify-between border-t border-hairline px-3 py-2 text-[11px] text-muted">
                <span>Candidate names stay masked here, exactly as they are on screen.</span>
                <kbd className="rounded border border-hairline px-1.5 py-0.5">esc</kbd>
              </footer>
            </Command>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

function Item({
  children,
  onSelect,
  icon,
  hint,
  value,
}: {
  children: React.ReactNode;
  onSelect: () => void;
  icon: React.ReactNode;
  hint?: string;
  value?: string;
}) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-body
                 aria-selected:bg-jade-tint aria-selected:text-slate-ink"
    >
      <span className="text-muted">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {hint ? <span className="shrink-0 text-[11px] text-muted">{hint}</span> : null}
    </Command.Item>
  );
}
