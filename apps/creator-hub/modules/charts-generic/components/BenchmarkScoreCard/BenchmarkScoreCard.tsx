import React, { useMemo, forwardRef, ForwardRefRenderFunction } from 'react';
import { Card, CardActionArea, CardHeader, Skeleton, Typography } from '@rbx/ui';

import { Flex } from '@modules/miscellaneous/common/components';
import { FormattedText } from '@modules/analytics-translations';
import useBenchmarkScoreCardStyles from './BenchmarkScoreCard.styles';
import { GenericChartState } from '../../charts/types/ChartTypes';
import GenericCardContentWrapper from '../../cards/GenericCardContentWrapper';
import BenchmarkStaticSlider from '../BenchmarkStaticSlider/BenchmarkStaticSlider';
import { TCardStyleConfig } from '../../types/CardStyleConfig';

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
          variant='h2'
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
