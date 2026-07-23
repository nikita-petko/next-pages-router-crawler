import type { FC } from 'react';
import React, { Fragment, useCallback } from 'react';
import { Button, CircularProgress } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { EmptyGrid } from '@modules/miscellaneous/components';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import EmptyStateBorder from '@modules/miscellaneous/components/EmptyState/EmptyStateBorder';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import { useRecommendedEventsLiveEventsApiData } from '../../../context/dataProviders/RecommendedEventsLiveEventsApiDataProvider';
import { useRecommendedEventsLiveEventsHasEventsApiData } from '../../../context/dataProviders/RecommendedEventsLiveEventsHasEventsApiDataProvider';
import useRAQIV2TranslationDependencies from '../../../hooks/useRAQIV2TranslationDependencies';
import useRecommendedEventsLiveEventsTableDialogStyles from './RecommendedEventsLiveEventsTableDialog.styles';

const RecommendedEventsLiveEventsDialogContentWrapper: FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { translate } = useRAQIV2TranslationDependencies();
  const {
    classes: { dialogContent },
  } = useRecommendedEventsLiveEventsTableDialogStyles();

  const {
    data: hasEvents,
    isResponseFailed: hasEventsFailed,
    isLoading: hasEventsLoading,
    refresh: refreshHasEvents,
  } = useRecommendedEventsLiveEventsHasEventsApiData();
  const {
    isResponseFailed: liveEventsFailed,
    isLoading: liveEventsLoading,
    refresh: refreshLiveEvents,
  } = useRecommendedEventsLiveEventsApiData();
  const isResponseFailed = hasEventsFailed || liveEventsFailed;
  const isDataLoading = hasEventsLoading || liveEventsLoading;
  const refresh = useCallback(() => {
    refreshHasEvents();
    refreshLiveEvents();
  }, [refreshHasEvents, refreshLiveEvents]);

  if (isDataLoading) {
    return (
      <div className={dialogContent}>
        <EmptyGrid>
          <CircularProgress data-testid='loading-spinner' />
        </EmptyGrid>
      </div>
    );
  }

  if (isResponseFailed) {
    return (
      <div className={dialogContent}>
        <EmptyStateBorder>
          <EmptyState
            title={translate(
              translationKey('Message.RequestFailure', TranslationNamespace.Analytics),
            )}
            size='small'>
            <Button
              size='medium'
              variant='contained'
              color='primary'
              data-testid='empty-state-cta-button'
              onClick={refresh}>
              {translate(
                translationKey('EmptyState.Action.TryAgain', TranslationNamespace.Analytics),
              )}
            </Button>
          </EmptyState>
        </EmptyStateBorder>
      </div>
    );
  }

  if (!hasEvents) {
    return (
      <div className={dialogContent}>
        <EmptyStateBorder>
          <EmptyState
            title={translate(
              translationKey('EmptyState.Title.NoLiveEvents', TranslationNamespace.Analytics),
            )}
            description={translate(
              translationKey('EmptyState.Description.NoLiveEvents', TranslationNamespace.Analytics),
            )}
            size='small'
            illustration='chart'>
            <Button
              size='medium'
              variant='contained'
              color='primary'
              data-testid='zero-state-cta-button'
              href={creatorHub.docs.getAnalyticsRetentionGuideUrl()}>
              {translate(translationKey('Action.GetStarted', TranslationNamespace.Analytics))}
            </Button>
          </EmptyState>
        </EmptyStateBorder>
      </div>
    );
  }

  return <>{children}</>;
};

export default RecommendedEventsLiveEventsDialogContentWrapper;
