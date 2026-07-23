import type { ForwardRefRenderFunction } from 'react';
import React, { useMemo, forwardRef } from 'react';
import { Card, CardActionArea, CardHeader, Skeleton, Typography } from '@rbx/ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import Flex from '@modules/miscellaneous/components/Flex';
import GenericCardContentWrapper from '../../cards/GenericCardContentWrapper';
import type { GenericChartState } from '../../charts/types/ChartTypes';
import type { TCardStyleConfig } from '../../types/CardStyleConfig';
import BenchmarkStaticSlider from '../BenchmarkStaticSlider/BenchmarkStaticSlider';
import useBenchmarkScoreCardStyles from './BenchmarkScoreCard.styles';

const benchmarkScoreCardStyleConfig: TCardStyleConfig = {
  loadingBodyHeight: 114,
};

type BenchmarkScoreCardProps = {
  title: React.ReactNode;
  currentPercentile: number;
  currentScore: number;
  scoreIcon?: React.ReactNode;
  P50Score: number;
  P90Score: number;
  valueFormatter: (value: number) => FormattedText;
  onClick?: () => void;
  comparisonChip?: React.ReactNode;
} & GenericChartState;

const BenchmarkScoreCard: ForwardRefRenderFunction<HTMLDivElement, BenchmarkScoreCardProps> = (
  {
    title,
    currentPercentile,
    currentScore,
    scoreIcon,
    P50Score,
    P90Score,
    valueFormatter,
    onClick,
    comparisonChip,
    ...chartState
  },
  ref,
) => {
  const {
    classes: {
      card,
      cardActionArea,
      cardActionAreaNotClickable,
      cardActionFocusHighlightHidden,
      cardHeader,
      cardSubHeader,
      cardContent,
    },
    cx,
  } = useBenchmarkScoreCardStyles();

  const { record, stops } = useMemo(() => {
    return {
      record: {
        value: currentScore,
        percentile: currentPercentile,
      },
      stops: [
        {
          percentile: 50,
          value: P50Score,
        },
        {
          percentile: 90,
          value: P90Score,
        },
      ] as const,
    };
  }, [P50Score, P90Score, currentPercentile, currentScore]);

  const subHeader = useMemo(() => {
    return (
      <Flex alignItems='center'>
        {scoreIcon}
        <Typography
          variant='h5'
          color='primary'
          marginLeft={scoreIcon ? '4px' : undefined}
          marginRight={comparisonChip ? '8px' : undefined}>
          {chartState.isDataLoading ? (
            <Skeleton width={48} animate />
          ) : (
            valueFormatter(currentScore)
          )}
        </Typography>
        {comparisonChip}
      </Flex>
    );
  }, [chartState.isDataLoading, comparisonChip, currentScore, scoreIcon, valueFormatter]);

  return (
    <Card
      classes={{
        root: card,
      }}
      variant='outlined'
      ref={ref}>
      <CardActionArea
        classes={{
          root: cx(cardActionArea, {
            [cardActionAreaNotClickable]: !onClick,
          }),
          focusHighlight: cx({
            [cardActionFocusHighlightHidden]: !onClick,
          }),
        }}
        onClick={onClick}
        disableRipple>
        <CardHeader
          classes={{
            root: cardHeader,
            subheader: cardSubHeader,
          }}
          title={title}
          subheader={subHeader}
        />
        <GenericCardContentWrapper
          cardContentClass={cardContent}
          styleConfig={benchmarkScoreCardStyleConfig}
          {...chartState}>
          <BenchmarkStaticSlider record={record} stops={stops} valueFormatter={valueFormatter} />
        </GenericCardContentWrapper>
      </CardActionArea>
    </Card>
  );
};

export default forwardRef(BenchmarkScoreCard);
