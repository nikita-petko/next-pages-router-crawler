import React, { FC, useMemo } from 'react';
import RAQIV2ChartContext from '../../../types/RAQIV2ChartContext';
import computeRAQIV2SpecOverride from '../../../utils/computeRAQIV2SpecOverride';
import RAQIV2PredefinedSummaryItemConfig, {
  RAQIV2PredefinedSummaryItemKey,
} from '../../../constants/RAQIV2PredefinedSummaryItemConfig';
import GenericRAQIV2MetricSummaryItem from './GenericRAQIV2MetricSummaryItem';

type RAQIV2PredefinedSummaryItemProps = {
  predefinedKey: RAQIV2PredefinedSummaryItemKey;
  chartContext: RAQIV2ChartContext;
  showComparisonChip?: boolean;
};

const RAQIV2PredefinedSummaryItem: FC<RAQIV2PredefinedSummaryItemProps> = ({
  predefinedKey,
  chartContext,

  showComparisonChip,
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
    />
  );
};

export default RAQIV2PredefinedSummaryItem;
