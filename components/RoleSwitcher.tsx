'use client';

import { useRouter } from 'next/navigation';
import { ROLE_HOME, ROLE_LABEL } from './nav';
import { useDemo } from '@/lib/store';
import type { Role } from '@/lib/types';

const ROLES: Role[] = ['employer', 'candidate', 'admin'];

/**
 * There is no authentication in the demo, so the viewer simply declares who they are.
 * Switching persona navigates to that persona's home screen.
 */
export function RoleSwitcher({ active }: { active: Role | null }) {
  const router = useRouter();
  const { setRole } = useDemo();

  return (
    <div
      role="group"
      aria-label="Switch demo persona"
      className="inline-flex rounded-lg border border-hairline bg-jade-tint p-0.5"
    >
      {ROLES.map((role) => {
        const isActive = role === active;
        return (
          <button
            key={role}
            type="button"
            aria-current={isActive ? 'true' : undefined}
            onClick={() => {
              setRole(role);
              router.push(ROLE_HOME[role]);
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              isActive
                ? 'bg-surface text-jade-dark shadow-sm'
                : 'text-muted hover:text-slate-ink'
            }`}
          >
            {ROLE_LABEL[role]}
          </button>
        );
      })}
    </div>
  );
}
