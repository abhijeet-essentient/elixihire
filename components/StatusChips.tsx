import { Chip } from './ui';
import type { JobStatus, PipelineStage, VerificationStatus } from '@/lib/types';

export function JobStatusChip({ status }: { status: JobStatus }) {
  const tone = status === 'Open' ? 'jade' : status === 'Paused' ? 'amber' : 'neutral';
  return <Chip tone={tone}>{status}</Chip>;
}

export function VerificationChip({ status }: { status: VerificationStatus }) {
  const tone =
    status === 'Verified' ? 'jade' : status === 'Pending' ? 'blue' : status === 'On hold' ? 'amber' : 'red';
  return (
    <Chip tone={tone} title={`Organisation verification: ${status}`}>
      {status === 'Verified' ? '✓ ' : ''}
      {status}
    </Chip>
  );
}

export function StageChip({ stage }: { stage: PipelineStage }) {
  const tone =
    stage === 'Joined' || stage === '90-day follow-up'
      ? 'jade'
      : stage === 'Offer'
        ? 'blue'
        : stage === 'Applied'
          ? 'neutral'
          : 'amber';
  return <Chip tone={tone}>{stage}</Chip>;
}
