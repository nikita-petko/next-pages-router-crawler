import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import ComparisonChip from '@modules/charts-generic/charts/ComparisonChip';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import useDebouncedFunction from '@modules/miscellaneous/hooks/useDebouncedFunction';
import getAnalyticsMetricDisplayConfig from '../../../constants/AnalyticsMetricDisplayConfig';
import type { RAQIV2PredefinedSummaryItemKey } from '../../../constants/RAQIV2PredefinedSummaryItemConfig';
import RAQIV2PredefinedSummaryItemConfig from '../../../constants/RAQIV2PredefinedSummaryItemConfig';
import useRAQIV2Summary from '../../../hooks/useRAQIV2Summary';
import type RAQIV2ChartContext from '../../../types/RAQIV2ChartContext';
import type { TSummaryItemEventLogging } from '../../../types/SummaryItemEventLogger';
import computeRAQIV2LoggingMetricOverride from '../../../utils/computeRAQIV2LoggingMetricOverride';
import computeRAQIV2LoggingResourceField from '../../../utils/computeRAQIV2LoggingResourceField';
import computeRAQIV2SpecOverride from '../../../utils/computeRAQIV2SpecOverride';

type RAQIV2PredefinedSummaryComparisonChipProps = {
  predefinedKey: RAQIV2PredefinedSummaryItemKey;
  chartContext: RAQIV2ChartContext;
  eventLogging?: TSummaryItemEventLogging;
};

const RAQIV2PredefinedSummaryComparisonChip: FC<RAQIV2PredefinedSummaryComparisonChipProps> = ({
  predefinedKey,
  chartContext,
  eventLogging,
}) => {
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { metric, totalSummaryType, overrides } = RAQIV2PredefinedSummaryItemConfig[predefinedKey];

  const chartSpec = useMemo(() => {
    return computeRAQIV2SpecOverride({ ...chartContext, metric }, overrides);
  }, [chartContext, metric, overrides]);

  const { resource } = chartContext;
  const resourceLoggingFields = useMemo(() => {
    return computeRAQIV2LoggingResourceField(resource);
  }, [resource]);

  const { summary } = useRAQIV2Summary(chartSpec, totalSummaryType);

  const logComparisonHoverEvent = useCallback(() => {
    if (eventLogging) {
      const { loggingMetricOverride } = getAnalyticsMetricDisplayConfig(metric);
      unifiedLogger.logHoverEvent({
        eventName: eventLogging.eventNames.hoverComparison,
        parameters: {
          ...resourceLoggingFields,
          metric: computeRAQIV2LoggingMetricOverride(metric, loggingMetricOverride),
        },
      });
    }
  }, [eventLogging, unifiedLogger, resourceLoggingFields, metric]);
  const [debouncedSuggestionHoverLogging, clearDebouncedSuggesitonHoverLogging] =
    useDebouncedFunction(logComparisonHoverEvent, 500);

  return summary?.comparisonChipSpec ? (
    <div
      onMouseEnter={debouncedSuggestionHoverLogging}
      onMouseLeave={clearDebouncedSuggesitonHoverLogging}>
      <ComparisonChip {...summary.comparisonChipSpec} />
    </div>
  ) : null;
};

export default RAQIV2PredefinedSummaryComparisonChip;
