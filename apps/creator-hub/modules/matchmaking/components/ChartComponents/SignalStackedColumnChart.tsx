import React, { FunctionComponent, useCallback } from 'react';
import { GenericChartWrapper } from '@modules/charts-generic';
import { useTranslation } from '@rbx/intl';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  EmojiEventsIcon,
  Grid,
  InfoOutlinedIcon,
  Tooltip,
  Typography,
} from '@rbx/ui';
import { ChartStyleMode, ColumnChart } from '@rbx/analytics-ui';
import { numOfFakeServers } from '../../constants';
import { DataSeries } from '../../types/MatchmakingChartTypes';
import DefaultConfigurationSignals from '../../enums/DefaultConfigurationSignals';
import { defaultSignalsTranslationKeys } from '../../utils/translationGetter';
import useSignalStackedColumnChartStyles from './SignalStackedColumnChart.styles';
import { CustomSignal, ServerSignalScores } from '../../types/ConfigurationInfo';

export type SignalStackedColumnChartProps = {
  winningServerIndex: number | undefined;
  serverScores: number[];
  signalScores: ServerSignalScores[];
  customSignals?: CustomSignal[];
  defaultSignalWeightsMap: Map<string, number>;
};

const SignalStackedColumnChart: FunctionComponent<
  React.PropsWithChildren<SignalStackedColumnChartProps>
> = ({
  serverScores,
  winningServerIndex,
  signalScores,
  customSignals,
  defaultSignalWeightsMap,
}) => {
  const { translate } = useTranslation();
  const {
    classes: { chartTitle, tooltipIconPadding, trophyIcon },
  } = useSignalStackedColumnChartStyles();

  const orderedCategories = Array.from({ length: numOfFakeServers }, (_, i) => (i + 1).toString());

  const generateDefaultSignalsDataPoints = useCallback(
    (signal: DefaultConfigurationSignals, scores: ServerSignalScores[]) => {
      const dataPoints: [string, number][] = [];
      for (let i = 0; i < orderedCategories.length; i += 1) {
        const score = scores[i];
        const serverIndex = orderedCategories[i];
        const signalScore = score.defaultSignalScores.get(signal) ?? 0;
        dataPoints.push([serverIndex.toString(), signalScore]);
      }
      return {
        name: translate(defaultSignalsTranslationKeys[signal]),
        dataPoints,
      };
    },
    [orderedCategories, translate],
  );

  const generateCustomSignalsDataPoints = useCallback(
    (signalName: string, scores: ServerSignalScores[]) => {
      const dataPoints: [string, number][] = [];
      for (let i = 0; i < orderedCategories.length; i += 1) {
        const score = scores[i];
        const serverIndex = orderedCategories[i];
        const signalScore = score.customSignalScores.get(signalName) ?? 0;
        dataPoints.push([serverIndex.toString(), signalScore]);
      }
      return {
        name: signalName,
        dataPoints,
      };
    },
    [orderedCategories],
  );

  const generateSingleBarDefaultSignalsData = () => {
    const seriesData: DataSeries[] = [];
    Array.from(defaultSignalWeightsMap.keys()).forEach((signal) => {
      const data = generateDefaultSignalsDataPoints(
        signal as DefaultConfigurationSignals,
        signalScores,
      );
      seriesData.push(data);
    });
    if (customSignals) {
      customSignals.forEach((customSignal) => {
        const data = generateCustomSignalsDataPoints(customSignal.name, signalScores);
        seriesData.push(data);
      });
    }
    return seriesData;
  };

  const seriesData = generateSingleBarDefaultSignalsData();
  const getXAxisTotalTooltip = (x: number | string) => {
    const index = Number(x) - 1;
    const scoreTotal = serverScores[index];
    return translate('Label.Total', {
      score: scoreTotal.toString(),
    });
  };

  const title = (
    <Typography align='left' className={chartTitle} variant='h6'>
      {translate('Chart.ScoresHeader')}
    </Typography>
  );

  const definitionTooltip = (
    <Tooltip
      title={translate('Tooltip.ChartPreview')}
      placement='right'
      enterTouchDelay={0}
      leaveTouchDelay={3000}>
      <div className={tooltipIconPadding}>
        <InfoOutlinedIcon fontSize='small' />
      </div>
    </Tooltip>
  );

  const winningServer =
    winningServerIndex !== undefined ? (
      <Grid item container direction='row'>
        <EmojiEventsIcon className={trophyIcon} color='warning' />
        <Typography align='left' variant='captionHeader'>
          {translate('Chart.WinningServer')}{' '}
          {translate('Header.MockeServer', {
            number: (winningServerIndex + 1).toString(),
          })}
        </Typography>
      </Grid>
    ) : null;

  return (
    <Grid position='sticky'>
      <Accordion variant='filled' square defaultExpanded>
        <AccordionSummary>
          <Grid display='flex' container direction='column'>
            <Grid display='flex' direction='row'>
              {title}
              {definitionTooltip}
            </Grid>
            {winningServer}
          </Grid>
        </AccordionSummary>
        <AccordionDetails>
          <GenericChartWrapper
            isDataLoading={false}
            isResponseFailed={false}
            isUserForbidden={false}
            header={null}
            chartStyleMode={ChartStyleMode.Normal}>
            <ColumnChart
              data={{
                orderedCategories,
                series: seriesData,
              }}
              tooltipFormatters={{
                formatSeriesKeyForPoint: ({ seriesName }: { seriesName: string }) => {
                  return seriesName;
                },
                formatSeriesValueForPoint: ({ y }) => y.toString(),
                formatXForPoint: (x: number | string) => getXAxisTotalTooltip(x),
              }}
              xAxisFormatter={({ value }: { value: string | number }) =>
                `${translate('Header.MockeServer', {
                  number: value.toString(),
                })}`
              }
              xAxisType={{
                type: 'linear',
              }}
            />
          </GenericChartWrapper>
        </AccordionDetails>
      </Accordion>
    </Grid>
  );
};

export default SignalStackedColumnChart;
