import React, { FC, useMemo } from 'react';
import { SingleChartCardContainer, ChartAbnormalStatus, EmptyChart } from '@rbx/analytics-ui';
import type { FormattedText } from '@modules/analytics-translations';

type ExploreModeChartEmptyStateProps = {
  titleLabel: FormattedText;
  subtitleLabel: FormattedText;
  chartHeight?: number;
};

const DefaultChartHeight = 450;

const noDataAbnormalState = { status: ChartAbnormalStatus.NoData };

const ExploreModeChartEmptyState: FC<ExploreModeChartEmptyStateProps> = ({
  titleLabel,
  subtitleLabel,
  chartHeight = DefaultChartHeight,
}) => {
  const chartSummarySpecs = useMemo(
    () => [
      {
        key: 'empty-summary',
        summaryValue: '',
        description: subtitleLabel,
        abnormalStatus: ChartAbnormalStatus.NoData,
      },
    ],
    [subtitleLabel],
  );

  return (
    <SingleChartCardContainer
      titleLabel={titleLabel}
      chartSummarySpecs={chartSummarySpecs}
      abnormalState={noDataAbnormalState}>
      <EmptyChart height={chartHeight} />
    </SingleChartCardContainer>
  );
};

export default ExploreModeChartEmptyState;
