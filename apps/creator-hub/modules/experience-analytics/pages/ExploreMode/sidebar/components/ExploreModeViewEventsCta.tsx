import type { FC } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { Button } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { TChartConfiguratorMetrics } from '@modules/experience-analytics-shared/chartConfigurator/chartConfiguratorMetricsConfig';
import RecommendedEventsLiveEventsDialogContainer from '@modules/experience-analytics-shared/components/LiveEvents/Dialog/RecommendedEventsLiveEventsDialogContainer';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { getDefaultEventTypeForMetric } from '../utils/getDefaultEventTypeForMetric';

export type ExploreModeViewEventsCtaProps = {
  metric: TChartConfiguratorMetrics | null;
  variant?: 'Emphasis' | 'Standard';
};

// Live-events dialog trigger used by ExploreModeCTAs for the `view-events`
// action kind. Not intended as a standalone header export — the page wires
// it only through the declarative CTA action list.
const ExploreModeViewEventsCta: FC<ExploreModeViewEventsCtaProps> = ({
  metric,
  variant = 'Standard',
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const viewEventsLabel = tPendingTranslation(
    'View events',
    'Button label that opens a realtime table of recent events for the selected metric.',
    translationKey('Action.ExploreMode.ViewEvents', TranslationNamespace.Analytics),
  );

  // The metric-derived default seeds the dialog's internal event-type state.
  // Event type is *not* persisted to the page URL: the dialog owns it as
  // local state, re-seeded if the metric changes while the dialog is open.
  // That contract is what lets us drop the URL-filter cleanup effect that
  // used to live here.
  const defaultEventType = useMemo(() => getDefaultEventTypeForMetric(metric), [metric]);

  const [open, setOpen] = useState(false);
  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  if (defaultEventType === null) {
    return null;
  }

  return (
    <>
      <Button
        variant={variant}
        size='Medium'
        onClick={handleOpen}
        data-testid='explore-mode-view-events-button'>
        {viewEventsLabel}
      </Button>
      <RecommendedEventsLiveEventsDialogContainer
        open={open}
        onClose={handleClose}
        defaultEventType={defaultEventType}
      />
    </>
  );
};

export default ExploreModeViewEventsCta;
