import type { FC } from 'react';
import React, { useMemo } from 'react';
import type { AnalyticsSummaryCardConfig } from '../../../constants/RAQIV2PredefinedSummaryCardConfig';
import RAQIV2SummaryCardType from '../../../constants/RAQIV2SummaryCardType';
import type RAQIV2ChartContext from '../../../types/RAQIV2ChartContext';
import computeRAQIV2SpecOverride from '../../../utils/computeRAQIV2SpecOverride';
import GenericRAQIV2ItemSummaryCard from './GenericRAQIV2ItemSummaryCard';
import GenericRAQIV2MetricSummaryCard from './GenericRAQIV2MetricSummaryCard';
import GenericRAQIV2TopBreakdownSummaryCard from './GenericRAQIV2TopBreakdownSummaryCard';

type RAQIV2PredefinedSummaryCardProps = {
  config: AnalyticsSummaryCardConfig;
  chartContext: RAQIV2ChartContext;
};

const AnalyticsConfigSummaryCard: FC<RAQIV2PredefinedSummaryCardProps> = ({
  config,
  chartContext,
}) => {
  const { cardType, metric, summaryType, label, labelText, overrides, fullWidth } = config;

  const chartSpec = useMemo(() => {
    return computeRAQIV2SpecOverride({ ...chartContext, metric }, overrides);
  }, [chartContext, metric, overrides]);

  switch (cardType) {
    case RAQIV2SummaryCardType.Item: {
      const { getItemMetadata } = config;
      return (
        <GenericRAQIV2ItemSummaryCard
          getItemMetadata={getItemMetadata}
          spec={chartSpec}
          summaryType={summaryType}
          label={label}
          fullWidth={fullWidth}
        />
      );
    }
    case RAQIV2SummaryCardType.Metric:
      return (
        <GenericRAQIV2MetricSummaryCard
          spec={chartSpec}
          summaryType={summaryType}
          label={label}
          labelText={labelText}
          fullWidth={fullWidth}
          showComparisonChip={config.showComparisonChip}
        />
      );
    case RAQIV2SummaryCardType.TopBreakdown:
      return (
        <GenericRAQIV2TopBreakdownSummaryCard
          spec={chartSpec}
          summaryType={summaryType}
          label={label}
          fullWidth={fullWidth}
        />
      );
    default: {
      const exhaustiveCheck: never = cardType;
      throw new Error(`Unhandled summary card type ${String(exhaustiveCheck)}`);
    }
  }
};

export default AnalyticsConfigSummaryCard;
