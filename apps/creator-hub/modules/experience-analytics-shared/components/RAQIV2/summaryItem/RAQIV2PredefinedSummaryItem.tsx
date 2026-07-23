import type { FC } from 'react';
import React, { useMemo } from 'react';
import type { RAQIV2PredefinedSummaryItemKey } from '../../../constants/RAQIV2PredefinedSummaryItemConfig';
import RAQIV2PredefinedSummaryItemConfig from '../../../constants/RAQIV2PredefinedSummaryItemConfig';
import type RAQIV2ChartContext from '../../../types/RAQIV2ChartContext';
import computeRAQIV2SpecOverride from '../../../utils/computeRAQIV2SpecOverride';
import GenericRAQIV2MetricSummaryItem from './GenericRAQIV2MetricSummaryItem';

type RAQIV2PredefinedSummaryItemProps = {
  predefinedKey: RAQIV2PredefinedSummaryItemKey;
  chartContext: RAQIV2ChartContext;
  showComparisonChip?: boolean;
  variant?: 'default' | 'compact';
};

const RAQIV2PredefinedSummaryItem: FC<RAQIV2PredefinedSummaryItemProps> = ({
  predefinedKey,
  chartContext,
  showComparisonChip,
  variant,
}) => {
  const { metric, totalSummaryType, labelKey, overrides } =
    RAQIV2PredefinedSummaryItemConfig[predefinedKey];

  const chartSpec = useMemo(() => {
    return computeRAQIV2SpecOverride({ ...chartContext, metric }, overrides);
  }, [chartContext, metric, overrides]);

  return (
    <GenericRAQIV2MetricSummaryItem
      spec={chartSpec}
      summaryType={totalSummaryType}
      labelKey={labelKey}
      showComparisonChip={showComparisonChip}
      variant={variant}
    />
  );
};

export default RAQIV2PredefinedSummaryItem;
