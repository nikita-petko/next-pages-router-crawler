import React, { FC, memo, useMemo } from 'react';
import { Container, makeStyles } from '@rbx/ui';
import ChartCard, { ChartCardProps } from './ChartCard';
import ChartSummary, { ChartSummaryProps } from './ChartSummary';
import type { ChartCardDragDropOptions, ChartCardResizeOptions } from './ChartCardDragDropContext';
import ChartCardDragAndResizeContainer from './ChartCardDragAndResizeContainer';

export type SingleChartCardContainerProps = Omit<ChartCardProps, 'subTitle'> & {
  chartSummarySpecs: Array<ChartSummaryProps & { key: string }>;
  chartControl?: React.ReactNode;
  dragAndDropOptions?: ChartCardDragDropOptions;
  resizeOptions?: ChartCardResizeOptions;
};

const useStyles = makeStyles()((theme) => ({
  subTitleContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0px 8px',
  },
  chartControlContainer: {
    flex: '0 1 auto',
    marginLeft: '16px',
    display: 'flex',
    gap: '8px',
    flexDirection: 'row',
    [theme.breakpoints.down('Small')]: {
      flexDirection: 'column',
    },
  },
  summariesContainer: {
    display: 'flex',
    justifyContent: 'start',
    columnGap: '16px',
    rowGap: '8px',
    flexWrap: 'wrap',
  },
}));

const SingleChartCardContainer: FC<React.PropsWithChildren<SingleChartCardContainerProps>> = ({
  children,
  titleLabel,
  titleTooltipLabel,
  footerContent,
  downloadAction,
  secondaryAction,
  chartSummarySpecs,
  chartControl,
  abnormalState,
  dragAndDropOptions,
  resizeOptions,
  chartBanner,
}) => {
  const {
    classes: {
      subTitleContainer,
      chartControlContainer,
      summariesContainer,
    },
  } = useStyles();
  const subTitle = useMemo(() => {
    if (chartSummarySpecs.length === 0 && !chartControl) {
      return null;
    }
    return (
      <Container disableGutters classes={{ root: subTitleContainer }} maxWidth={false}>
        <div className={summariesContainer}>
          {chartSummarySpecs.map((chartSummarySpec) => (
            <ChartSummary
              {...chartSummarySpec}
              key={chartSummarySpec.key}
              abnormalStatus={abnormalState?.status}
            />
          ))}
        </div>
        {chartControl && <div className={chartControlContainer}>{chartControl}</div>}
      </Container>
    );
  }, [
    abnormalState?.status,
    chartControl,
    chartControlContainer,
    chartSummarySpecs,
    subTitleContainer,
    summariesContainer,
  ]);

  return (
    <ChartCardDragAndResizeContainer
      dragAndDropOptions={dragAndDropOptions}
      resizeOptions={resizeOptions}>
      <ChartCard
        titleLabel={titleLabel}
        titleTooltipLabel={titleTooltipLabel}
        secondaryAction={secondaryAction}
        downloadAction={downloadAction}
        footerContent={footerContent}
        subTitle={subTitle}
        abnormalState={abnormalState}
        chartBanner={chartBanner}>
        {children}
      </ChartCard>
    </ChartCardDragAndResizeContainer>
  );
};

export default memo(SingleChartCardContainer);
