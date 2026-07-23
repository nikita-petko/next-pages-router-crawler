import React from 'react';
import Link from 'next/link';
import { Icon } from '@rbx/foundation-ui';
import type { JobViewModel } from '../../types';
import { LOGO_SIZE_MEDIUM } from '../../constants';
import PlaceholderImage from '../shared/PlaceholderImage';
import styles from '../shared/Layout.module.css';

type JobCardProps = {
  job: JobViewModel;
  onClick: (job: JobViewModel) => void;
  variant?: 'list' | 'card';
  href?: string;
};

const ROW_BUTTON_CLASSES =
  'width-full bg-none padding-small small:padding-medium cursor-pointer transition-colors hover:bg-shift-200';

export const JobCard: React.FC<JobCardProps> = ({ job, onClick, variant = 'list', href }) => {
  const handleClick = () => onClick(job);

  if (variant === 'card' && href) {
    return (
      <Link
        href={href}
        className={`${styles.linkReset} ${ROW_BUTTON_CLASSES} flex items-center justify-between gap-small`}
        onClick={handleClick}
        data-testid={`job-card-${job.id}`}
        aria-label={`${job.title} at ${job.studioName ?? 'Studio'}`}>
        <div className='flex flex-col gap-xxsmall min-width-0 flex-1'>
          <div className='text-heading-small text-truncate-end'>{job.title}</div>
          <div className='text-body-small content-muted text-truncate-end'>
            {job.jobTypeLabel} | {job.locationLabel}
          </div>
        </div>
        <span className='content-muted flex-shrink-0'>
          <Icon name='icon-regular-chevron-small-right' size='XSmall' />
        </span>
      </Link>
    );
  }

  if (variant === 'card') {
    return (
      <button
        type='button'
        className={`${styles.buttonReset} ${ROW_BUTTON_CLASSES} flex items-center justify-between gap-small`}
        onClick={handleClick}
        data-testid={`job-card-${job.id}`}
        aria-label={`${job.title} at ${job.studioName ?? 'Studio'}`}>
        <div className='flex flex-col gap-xxsmall min-width-0 flex-1'>
          <div className='text-heading-small text-truncate-end'>{job.title}</div>
          <div className='text-body-small content-muted text-truncate-end'>
            {job.jobTypeLabel} | {job.locationLabel}
          </div>
        </div>
        <span className='content-muted flex-shrink-0'>
          <Icon name='icon-regular-chevron-small-right' size='XSmall' />
        </span>
      </button>
    );
  }

  return (
    <button
      type='button'
      className={`${styles.buttonReset} ${ROW_BUTTON_CLASSES} flex items-center gap-small`}
      onClick={handleClick}
      data-testid={`job-card-${job.id}`}
      aria-label={`${job.title} at ${job.studioName ?? 'Studio'}`}>
      {job.studioLogo ? (
        <div
          className='radius-small clip flex-shrink-0'
          style={{ width: LOGO_SIZE_MEDIUM, height: LOGO_SIZE_MEDIUM }}>
          <img
            src={job.studioLogo}
            alt=''
            className={`width-full height-full ${styles.objectCover}`}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      ) : (
        <PlaceholderImage size={LOGO_SIZE_MEDIUM} className='radius-small' />
      )}
      <div className='flex flex-col gap-xxsmall min-width-0 flex-1'>
        <div className='text-heading-small text-truncate-end'>{job.title}</div>
        <div className='text-body-small content-muted text-truncate-end'>
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
