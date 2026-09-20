'use client';

import { Send } from 'lucide-react';
import { useMemo, useState } from 'react';
import { StageChip } from '@/components/StatusChips';
import { Button, Card, DemoNote, EmptyState, PageHeader } from '@/components/ui';
import { viewCandidate } from '@/lib/mask';
import { useDemo, useSelectors } from '@/lib/store';

interface MockMessage {
  from: 'employer' | 'candidate';
  text: string;
  at: string;
}

/** Deterministic mock thread, derived from the engagement's own stage. */
function threadFor(stage: string, jobTitle: string): MockMessage[] {
  const base: MockMessage[] = [
    { from: 'employer', text: `Thanks for your interest in the ${jobTitle} post — we have your profile.`, at: '09:14' },
    { from: 'candidate', text: 'Thank you. Happy to share anything further you need.', at: '09:41' },
  ];
  if (stage === 'Applied') return base;
  base.push({
    from: 'employer',
    text: 'You have been shortlisted. Could you confirm your availability for the coming fortnight?',
    at: '11:02',
  });
  base.push({ from: 'candidate', text: 'Evenings work best around my current rota.', at: '13:20' });
  if (stage === 'Shortlisted') return base;
  base.push({ from: 'employer', text: 'Interview slot proposed — see the invite on your applications page.', at: '16:45' });
  if (stage === 'Interview') return base;
  base.push({ from: 'employer', text: 'The panel was positive. We are preparing an offer.', at: '10:05' });
  base.push({ from: 'candidate', text: 'That is excellent news, thank you.', at: '10:18' });
  return base;
}

export default function MessagesPage() {
  const { applications, revealedCandidateIds } = useDemo();
  const { employerJobs, candidateById, jobById } = useSelectors();

  const threads = useMemo(() => {
    const ids = new Set(employerJobs.map((j) => j.id));
    return applications.filter((a) => ids.has(a.jobId) && a.shortlisted);
  }, [applications, employerJobs]);

  const [activeId, setActiveId] = useState(threads[0]?.id ?? '');
  const active = threads.find((t) => t.id === activeId) ?? threads[0];
  const candidate = active ? candidateById(active.candidateId) : undefined;
  const job = active ? jobById(active.jobId) : undefined;
  const [draft, setDraft] = useState('');

  if (threads.length === 0) {
    return (
      <div>
        <PageHeader title="Messages" lede="Threaded conversation with each candidate." />
        <EmptyState title="No conversations yet" body="Shortlist a candidate to open a thread." />
      </div>
    );
  }

  const messages = active && job ? threadFor(active.stage, job.title) : [];
  const view = candidate ? viewCandidate(candidate, revealedCandidateIds.includes(candidate.id)) : null;

  return (
    <div>
      <PageHeader
        title="Messages"
        lede="One thread per candidate, in the same place as the pipeline. Mock conversation — nothing is sent."
      />

      <div className="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <Card className="p-2">
          <ul className="space-y-1" role="list">
            {threads.map((thread) => {
              const c = candidateById(thread.candidateId);
              const j = jobById(thread.jobId);
              const on = thread.id === active?.id;
              return (
                <li key={thread.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(thread.id)}
                    aria-current={on ? 'true' : undefined}
                    className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors ${
                      on ? 'bg-jade-tint' : 'hover:bg-jade-tint/60'
                    }`}
                  >
                    <p className="text-sm font-medium text-slate-ink">
                      {c ? viewCandidate(c, revealedCandidateIds.includes(c.id)).name : 'Unknown'}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted">{j?.title}</p>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="flex min-h-[26rem] flex-col p-0">
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline px-5 py-3">
            <div>
              <h2 className="font-serif text-lg text-slate-ink">{view?.name}</h2>
              <p className="text-xs text-muted">{job?.title}</p>
            </div>
            {active ? <StageChip stage={active.stage} /> : null}
          </header>

          <ul className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {messages.map((message, index) => (
              <li
                key={index}
                className={
                  message.from === 'employer'
                    ? 'max-w-[85%] rounded-lg rounded-tl-sm border border-hairline bg-jade-tint/40 p-3'
                    : 'ml-auto max-w-[85%] rounded-lg rounded-tr-sm border border-jade/25 bg-jade/10 p-3'
                }
              >
                <p className="text-sm text-body">{message.text}</p>
                <p className="mt-1 text-[11px] text-muted">
                  {message.from === 'employer' ? 'You' : view?.name} · {message.at}
                </p>
              </li>
            ))}
          </ul>

          <form
            className="flex gap-2 border-t border-hairline px-5 py-3"
            onSubmit={(e) => e.preventDefault()}
          >
            <label className="sr-only" htmlFor="message">
              Message
            </label>
            <input
              id="message"
              className="input flex-1"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Messaging is a preview — this box does not send"
            />
            <Button type="submit" disabled title="Preview capability — sending is disabled">
              <Send aria-hidden="true" className="h-3.5 w-3.5" />
              Send
            </Button>
          </form>
        </Card>
      </div>

      <div className="mt-6">
        <DemoNote>
          The thread above is composed from the engagement&apos;s pipeline stage, so it reads
          plausibly, but no message is stored or delivered.
        </DemoNote>
      </div>
    </div>
  );
}
