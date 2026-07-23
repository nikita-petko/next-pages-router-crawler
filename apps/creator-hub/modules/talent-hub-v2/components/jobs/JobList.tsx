import React from 'react';
import type { JobViewModel } from '../../types';
import EmptyState from '../feedback/EmptyState';
import ErrorState from '../feedback/ErrorState';
import LoadingState from '../feedback/LoadingState';
import { JobCard } from './JobCard';
import styles from '../shared/Layout.module.css';

type JobListProps = {
  jobs: JobViewModel[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  onJobClick: (job: JobViewModel) => void;
};

export const JobList: React.FC<JobListProps> = ({
  jobs,
  isLoading,
  error,
  onRetry,
  onJobClick,
}) => {
  if (isLoading) {
    return <LoadingState itemCount={4} />;
  }

  if (error) {
    return (
      <ErrorState
        title='Unable to load jobs'
        description='Please try again in a moment.'
        actionLabel={onRetry ? 'Try again' : undefined}
        onAction={onRetry}
      />
    );
  }

  if (jobs.length === 0) {
    return (
      <EmptyState title='No jobs found' description='Try adjusting filters or check back later.' />
    );
  }

  return (
    <div
      className={`flex flex-col radius-medium ${styles.borderedCard} ${styles.dividedList}`}
      data-testid='job-list'>
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} onClick={onJobClick} />
      ))}
    </div>
  );
};

export default JobList;
