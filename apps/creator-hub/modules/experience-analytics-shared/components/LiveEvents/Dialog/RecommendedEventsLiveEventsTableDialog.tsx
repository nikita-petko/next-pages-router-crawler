import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import { Dialog, DialogTemplate } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { RecommendedEventType } from '@modules/clients/analytics';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useRecommendedEventsLiveEventsApiData } from '../../../context/dataProviders/RecommendedEventsLiveEventsApiDataProvider';
import { useRecommendedEventsLiveEventsHasEventsApiData } from '../../../context/dataProviders/RecommendedEventsLiveEventsHasEventsApiDataProvider';
import useRAQIV2TranslationDependencies from '../../../hooks/useRAQIV2TranslationDependencies';
import RecommendedEventsLiveEventsDialogContentWrapper from './RecommendedEventsLiveEventsDialogContentWrapper';
import RecommendedEventsLiveEventsTableWithFilters from './RecommendedEventsLiveEventsTableWithFilters';

// Props the dialog exposes to external callers. The caller passes a
// metric/page-derived `defaultEventType`; the container turns that into
// internal `[eventType, onEventTypeChange]` state for the inner dialog.
export type RecommendedEventsLiveEventsDialogProps = {
  open: boolean;
  onClose: () => void;
  defaultEventType: RecommendedEventType;
};

type RecommendedEventsLiveEventsDialogInternalProps = {
  open: boolean;
  onClose: () => void;
  eventType: RecommendedEventType;
  onEventTypeChange: (next: RecommendedEventType) => void;
};

const RecommendedEventsLiveEventsDialog: FC<RecommendedEventsLiveEventsDialogInternalProps> = ({
  open,
  onClose,
  eventType,
  onEventTypeChange,
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
        <RecommendedEventsLiveEventsTableWithFilters
          eventType={eventType}
          onEventTypeChange={onEventTypeChange}
        />
      </RecommendedEventsLiveEventsDialogContentWrapper>
    ),
    [eventType, onEventTypeChange],
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
