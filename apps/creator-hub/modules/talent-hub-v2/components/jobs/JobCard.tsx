import Link from 'next/link';
import React from 'react';
import { Icon } from '@rbx/foundation-ui';
import { LOGO_SIZE_MEDIUM } from '../../constants';
import type { JobViewModel } from '../../types';
import StudioLogo from '../shared/StudioLogo';
import styles from '../shared/Layout.module.css';

type JobCardProps = {
  job: JobViewModel;
  onClick: (job: JobViewModel) => void;
  variant?: 'list' | 'card';
  href?: string;
};

const ROW_BUTTON_CLASSES = 'width-full bg-none cursor-pointer transition-colors hover:bg-shift-200';

export const JobCard: React.FC<JobCardProps> = ({ job, onClick, variant = 'list', href }) => {
  const handleClick = () => onClick(job);

  if (variant === 'card' && href) {
    return (
      <Link
        href={href}
        className={`${styles.linkReset} ${ROW_BUTTON_CLASSES} ${styles.studioProfileJobRow} flex items-center justify-between gap-small`}
        onClick={handleClick}
        data-testid={`job-card-${job.id}`}
        aria-label={`${job.title} at ${job.studioName ?? 'Studio'}`}>
        <div className='flex flex-col gap-xsmall min-width-0 flex-1'>
          <div className='text-title-large text-truncate-end'>{job.title}</div>
          <div className='text-body-small content-muted text-truncate-end'>
            {job.jobTypeLabel} | {job.locationLabel}
          </div>
        </div>
        <span className='content-muted flex-shrink-0'>
          <Icon name='icon-regular-chevron-small-right' size='Small' />
        </span>
      </Link>
    );
  }

  if (variant === 'card') {
    return (
      <button
        type='button'
        className={`${styles.buttonReset} ${ROW_BUTTON_CLASSES} ${styles.studioProfileJobRow} flex items-center justify-between gap-small`}
        onClick={handleClick}
        data-testid={`job-card-${job.id}`}
        aria-label={`${job.title} at ${job.studioName ?? 'Studio'}`}>
        <div className='flex flex-col gap-xsmall min-width-0 flex-1'>
          <div className='text-title-large text-truncate-end'>{job.title}</div>
          <div className='text-body-small content-muted text-truncate-end'>
            {job.jobTypeLabel} | {job.locationLabel}
          </div>
        </div>
        <span className='content-muted flex-shrink-0'>
          <Icon name='icon-regular-chevron-small-right' size='Small' />
        </span>
      </button>
    );
  }

  return (
    <button
      type='button'
      className={`${styles.buttonReset} ${ROW_BUTTON_CLASSES} ${styles.jobCardRow} flex items-center gap-small`}
      onClick={handleClick}
      data-testid={`job-card-${job.id}`}
      aria-label={`${job.title} at ${job.studioName ?? 'Studio'}`}>
      <StudioLogo
        logo={job.studioLogo}
        groupId={job.studioGroupId}
        size={LOGO_SIZE_MEDIUM}
        className='radius-small'
      />
      <div className='flex flex-col gap-xxsmall min-width-0 flex-1'>
        <div className='text-title-large text-truncate-end'>{job.title}</div>
        <div className='text-body-large content-muted text-truncate-end'>
          {job.studioName ?? 'Studio'}
        </div>
        <div className='text-body-small content-muted text-truncate-end'>
          {job.jobTypeLabel} &middot; {job.locationLabel}
        </div>
      </div>
    </button>
  );
};

export default JobCard;
