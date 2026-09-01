import React from 'react';
import { Badge, clsx, Icon } from '@rbx/foundation-ui';
import { JobStatus } from '../types';
import type { Job, JobViewModel } from '../types';
import { formatRelativeTimeShort } from '../utils';
import styles from '../components/shared/Layout.module.css';

export type JobRowProps = {
  job: JobViewModel;
  raw: Job;
  applicationsCount: number;
  onSelect: (jobId: string) => void;
};

export const JobRow: React.FC<JobRowProps> = ({ job, raw, applicationsCount, onSelect }) => {
  const badgeLabel = `${applicationsCount} ${applicationsCount === 1 ? 'application' : 'applications'}`;
  const isClosed = raw.status === JobStatus.NUMBER_1;

  return (
    <button
      type='button'
      className={clsx(styles.buttonReset, styles.myJobsCard)}
      onClick={() => raw.id && onSelect(raw.id)}
      data-testid={`my-job-${raw.id}`}>
      <div className='text-left min-width-0 gap-xxsmall flex flex-col'>
        <span className={styles.myJobsTitle}>{job.title}</span>
        <span className='content-muted text-body-medium'>
          {job.jobTypeLabel} | {job.locationLabel}
        </span>
        <span className='content-muted text-body-medium'>
          {formatRelativeTimeShort(job.createdAt)}
        </span>
      </div>
      <div className='flex-shrink-0 items-center gap-small flex'>
        {isClosed ? <Badge label='Closed' variant='Neutral' /> : null}
        <Badge label={badgeLabel} variant='Neutral' />
        <Icon name='icon-regular-chevron-small-right' size='Small' />
      </div>
    </button>
  );
};
