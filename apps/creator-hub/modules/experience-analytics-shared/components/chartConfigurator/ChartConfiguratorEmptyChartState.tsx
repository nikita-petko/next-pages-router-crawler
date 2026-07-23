import type { FC } from 'react';
import { useMemo } from 'react';
import { SingleChartCardContainer, ChartAbnormalStatus, EmptyChart } from '@rbx/analytics-ui';
import type { FormattedText } from '@modules/analytics-translations/types';

type ChartConfiguratorEmptyChartStateProps = {
  // Accepts either translated text or a user-entered formula name.
  readonly titleLabel: FormattedText | string;
  readonly subtitleLabel: FormattedText;
  readonly chartHeight?: number;
  readonly isError?: boolean;
  readonly errorDescription?: FormattedText;
};

const defaultChartHeight = 450;

const noDataAbnormalState = { status: ChartAbnormalStatus.NoData };

const ChartConfiguratorEmptyChartState: FC<ChartConfiguratorEmptyChartStateProps> = ({
  titleLabel,
  subtitleLabel,
  chartHeight = defaultChartHeight,
  isError = false,
  errorDescription,
}) => {
  const abnormalStatus = isError ? ChartAbnormalStatus.Error : ChartAbnormalStatus.NoData;

  const abnormalState = useMemo(
    () =>
      isError
        ? { status: ChartAbnormalStatus.Error, description: errorDescription }
        : noDataAbnormalState,
    [isError, errorDescription],
  );

  const chartSummarySpecs = useMemo(
    () => [
      {
        key: 'empty-summary',
        summaryValue: '',
        description: subtitleLabel,
        abnormalStatus,
      },
    ],
    [subtitleLabel, abnormalStatus],
  );

  return (
    <SingleChartCardContainer
      titleLabel={titleLabel}
      chartSummarySpecs={chartSummarySpecs}
      abnormalState={abnormalState}>
      {isError ? <div style={{ height: chartHeight }} /> : <EmptyChart height={chartHeight} />}
    </SingleChartCardContainer>
  );
};

export default ChartConfiguratorEmptyChartState;
