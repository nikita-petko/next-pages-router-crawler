import React from 'react';
import type { StudioViewModel } from '../../types';
import EmptyState from '../feedback/EmptyState';
import ErrorState from '../feedback/ErrorState';
import LoadingState from '../feedback/LoadingState';
import { StudioCard } from './StudioCard';
import styles from '../shared/Layout.module.css';

type StudioListProps = {
  studios: StudioViewModel[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  getStudioHref: (studio: StudioViewModel) => string;
  onStudioClick?: (studio: StudioViewModel) => void;
};

export const StudioList: React.FC<StudioListProps> = ({
  studios,
  isLoading,
  error,
  onRetry,
  getStudioHref,
  onStudioClick,
}) => {
  if (isLoading) {
    return <LoadingState itemCount={6} />;
  }

  if (error) {
    return (
      <ErrorState
        title='Unable to load studios'
        description='Please try again in a moment.'
        actionLabel={onRetry ? 'Try again' : undefined}
        onAction={onRetry}
      />
    );
  }

  if (studios.length === 0) {
    return <EmptyState title='No studios found' description='Check back later for new studios.' />;
  }

  return (
    <div className={styles.studioGrid} data-testid='studio-list'>
      {studios.map((studio) => (
        <StudioCard
          key={studio.id}
          studio={studio}
          href={getStudioHref(studio)}
          onClick={onStudioClick}
        />
      ))}
    </div>
  );
};

export default StudioList;
