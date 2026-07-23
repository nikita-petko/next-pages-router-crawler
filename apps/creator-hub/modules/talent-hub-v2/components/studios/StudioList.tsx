import React from 'react';
import { useTranslation } from '@rbx/intl';
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
  preferCommunityLink?: boolean;
};

export const StudioList: React.FC<StudioListProps> = ({
  studios,
  isLoading,
  error,
  onRetry,
  getStudioHref,
  onStudioClick,
  preferCommunityLink = false,
}) => {
  const { translate } = useTranslation();
  if (isLoading) {
    return <LoadingState itemCount={6} />;
  }

  if (error) {
    return (
      <ErrorState
        title={translate('Error.UnableToLoadStudios')}
        description={translate('Error.PleaseTryAgain')}
        actionLabel={onRetry ? translate('Action.TryAgain') : undefined}
        onAction={onRetry}
      />
    );
  }

  if (studios.length === 0) {
    return (
      <EmptyState
        title={translate('Empty.NoStudiosFound')}
        description={translate('Empty.CheckBackLater')}
      />
    );
  }

  return (
    <div className={styles.studioGrid} data-testid='studio-list'>
      {studios.map((studio) => (
        <StudioCard
          key={studio.id}
          studio={studio}
          href={getStudioHref(studio)}
          onClick={onStudioClick}
          preferCommunityLink={preferCommunityLink}
        />
      ))}
    </div>
  );
};

export default StudioList;
