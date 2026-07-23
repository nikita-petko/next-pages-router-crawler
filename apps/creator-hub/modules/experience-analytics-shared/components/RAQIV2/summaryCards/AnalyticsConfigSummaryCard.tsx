import React, { FC, useMemo } from 'react';
import RAQIV2ChartContext from '../../../types/RAQIV2ChartContext';
import computeRAQIV2SpecOverride from '../../../utils/computeRAQIV2SpecOverride';
import GenericRAQIV2ItemSummaryCard from './GenericRAQIV2ItemSummaryCard';
import GenericRAQIV2MetricSummaryCard from './GenericRAQIV2MetricSummaryCard';
import GenericRAQIV2TopBreakdownSummaryCard from './GenericRAQIV2TopBreakdownSummaryCard';
import RAQIV2SummaryCardType from '../../../constants/RAQIV2SummaryCardType';
import type { AnalyticsSummaryCardConfig } from '../../../constants/RAQIV2PredefinedSummaryCardConfig';

type RAQIV2PredefinedSummaryCardProps = {
  config: AnalyticsSummaryCardConfig;
  chartContext: RAQIV2ChartContext;
};

const AnalyticsConfigSummaryCard: FC<RAQIV2PredefinedSummaryCardProps> = ({
  config,
  chartContext,
}) => {
  const { cardType, metric, summaryType, label, overrides, fullWidth } = config;

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
          fullWidth={fullWidth}
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
      throw new Error(`Unhandled summary card type ${exhaustiveCheck}`);
    }
  }
};

export default AnalyticsConfigSummaryCard;
