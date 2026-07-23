import React, { FC, useCallback, useMemo } from 'react';
import { Dialog, DialogTemplate } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { RecommendedEventType } from '@modules/clients/analytics';
import useRAQIV2TranslationDependencies from '../../../hooks/useRAQIV2TranslationDependencies';
import { useRecommendedEventsLiveEventsApiData } from '../../../context/dataProviders/RecommendedEventsLiveEventsApiDataProvider';
import { useRecommendedEventsLiveEventsHasEventsApiData } from '../../../context/dataProviders/RecommendedEventsLiveEventsHasEventsApiDataProvider';
import RecommendedEventsLiveEventsDialogContentWrapper from './RecommendedEventsLiveEventsDialogContentWrapper';
import RecommendedEventsLiveEventsTableWithFilters from './RecommendedEventsLiveEventsTableWithFilters';

export type RecommendedEventsLiveEventsDialogProps = {
  open: boolean;
  onClose: () => void;
  defaultEventType: RecommendedEventType;
};

const RecommendedEventsLiveEventsDialog: FC<RecommendedEventsLiveEventsDialogProps> = ({
  open,
  onClose,
  defaultEventType,
}) => {
  const { translate } = useRAQIV2TranslationDependencies();
  const { refresh: liveEventsRefresh } = useRecommendedEventsLiveEventsApiData();
  const { refresh: hasEventsRefresh } = useRecommendedEventsLiveEventsHasEventsApiData();

  const refresh = useCallback(() => {
    liveEventsRefresh();
    hasEventsRefresh();
  }, [liveEventsRefresh, hasEventsRefresh]);

  const content = useMemo(
    () => (
      <RecommendedEventsLiveEventsDialogContentWrapper>
        <RecommendedEventsLiveEventsTableWithFilters defaultEventType={defaultEventType} />
      </RecommendedEventsLiveEventsDialogContentWrapper>
    ),
    [defaultEventType],
  );

  return (
    <Dialog open={open} maxWidth='Large' fullWidth data-testid='live-events-dialog'>
      <DialogTemplate
        title={translate(translationKey('Label.LiveEvents', TranslationNamespace.Analytics))}
        content={content}
        confirmText={translate(translationKey('Action.Refresh', TranslationNamespace.Analytics))}
        cancelText={translate(translationKey('Action.Close', TranslationNamespace.Analytics))}
        onConfirm={refresh}
        onCancel={onClose}
      />
    </Dialog>
  );
};

export default RecommendedEventsLiveEventsDialog;
