import React, { FC, Fragment, useCallback } from 'react';
import { translationKey } from '@modules/analytics-translations';
import { Button, CircularProgress } from '@rbx/ui';
import { EmptyGrid, urls } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { EmptyState, EmptyStateBorder } from '@modules/miscellaneous/common/components';
import useRecommendedEventsLiveEventsTableDialogStyles from './RecommendedEventsLiveEventsTableDialog.styles';
import useRAQIV2TranslationDependencies from '../../../hooks/useRAQIV2TranslationDependencies';
import { useRecommendedEventsLiveEventsHasEventsApiData } from '../../../context/dataProviders/RecommendedEventsLiveEventsHasEventsApiDataProvider';
import { useRecommendedEventsLiveEventsApiData } from '../../../context/dataProviders/RecommendedEventsLiveEventsApiDataProvider';

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
              href={urls.creatorHub.docs.getAnalyticsRetentionGuideUrl()}>
              {translate(translationKey('Action.GetStarted', TranslationNamespace.Analytics))}
            </Button>
          </EmptyState>
        </EmptyStateBorder>
      </div>
    );
  }

  return <Fragment>{children}</Fragment>;
};

export default RecommendedEventsLiveEventsDialogContentWrapper;
