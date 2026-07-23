import type { FC, ReactElement, ReactNode } from 'react';
import React, { useMemo, useRef } from 'react';
import { ChartStyleMode } from '@rbx/analytics-ui';
import { useTranslation } from '@rbx/intl';
import { CircularProgress, Container, Grid, Typography } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { EmptyGrid } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useChartStyles, { useChartErrorStateStyles } from './Chart.styles';
import type ChartFooter from './ChartFooter';
import type ChartHeader from './ChartHeader';
import { getChartDefaultHeightByMode } from './options';
import type { GenericChartState } from './types/ChartTypes';

type ErrorStateContainerProps = {
  chartHeight?: number;
  chartStyleMode: ChartStyleMode;
};

const ErrorStateContainer: FC<React.PropsWithChildren<ErrorStateContainerProps>> = ({
  children,
  chartHeight,
  chartStyleMode,
}) => {
  const {
    classes: { errorState },
  } = useChartErrorStateStyles({ customChartHeight: chartHeight });
  return (
    <Grid className={errorState}>
      {chartStyleMode === ChartStyleMode.Minimal ? children : <EmptyGrid>{children}</EmptyGrid>}
    </Grid>
  );
};

type GenericChartWrapperProps = GenericChartState & {
  header: ReactElement<typeof ChartHeader> | null;
  footer?: ReactElement<typeof ChartFooter> | null;
  chartControl?: React.JSX.Element | null;
  chartHeight?: number;
  showNoDataMessage?: boolean;
  chartStyleMode: ChartStyleMode;
};

const GenericChartWrapper: FC<React.PropsWithChildren<GenericChartWrapperProps>> = ({
  children,
  header,
  footer,
  chartControl,
  chartHeight: chartHeightOverride,
  isDataLoading,
  isUserForbidden,
  isResponseFailed,
  showNoDataMessage,
  chartStyleMode,
}) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const {
    classes: { chartHeaderContainer, chartBodyContainer },
  } = useChartStyles();

  const hasHeader = !!chartControl;

  const errorStateChartHeight = useMemo(() => {
    const height = chartHeightOverride ?? getChartDefaultHeightByMode(chartStyleMode);

    // If header is present, add 92px to the height to account for the header and control
    // this is the best estimate so when a regular chart and tabbed charts render side by side,
    // they will have the same height and align properly
    return hasHeader ? height + 92 : height;
  }, [chartHeightOverride, chartStyleMode, hasHeader]);

  const chartWrapperRef = useRef<HTMLDivElement>(null);

  const wrapped = (body: ReactNode) => {
    return (
      <Grid
        item
        XSmall={12}
        className={hasHeader ? chartHeaderContainer : undefined}
        ref={chartWrapperRef}>
        {header}
        {chartControl}
        <Container disableGutters className={chartBodyContainer} maxWidth={false}>
          {body}
        </Container>
        {footer}
      </Grid>
    );
  };

  if (isDataLoading) {
    return wrapped(
      <ErrorStateContainer chartHeight={errorStateChartHeight} chartStyleMode={chartStyleMode}>
        <CircularProgress />
      </ErrorStateContainer>,
    );
  }
  if (isUserForbidden) {
    return wrapped(
      <ErrorStateContainer chartHeight={errorStateChartHeight} chartStyleMode={chartStyleMode}>
        <Typography align='center'>
          {translate(translationKey('Message.UserHasNoPermission', TranslationNamespace.Analytics))}
        </Typography>
      </ErrorStateContainer>,
    );
  }
  if (isResponseFailed) {
    return wrapped(
      <ErrorStateContainer chartHeight={errorStateChartHeight} chartStyleMode={chartStyleMode}>
        <Typography align='center'>
          {translate(translationKey('Message.RequestFailure', TranslationNamespace.Analytics))}
        </Typography>
      </ErrorStateContainer>,
    );
  }
  if (showNoDataMessage) {
    // NOTE(gperkins@ 20220907): meaning there are no *time series*, not merely no data points in one series
    return wrapped(
      <ErrorStateContainer chartHeight={errorStateChartHeight} chartStyleMode={chartStyleMode}>
        <Typography align='center'>
          {translate(translationKey('Message.NoDataReturn', TranslationNamespace.Analytics))}
        </Typography>
      </ErrorStateContainer>,
    );
  }

  return wrapped(children);
};
export default GenericChartWrapper;
