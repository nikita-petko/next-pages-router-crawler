import React, { FC, ReactElement, ReactNode, useMemo, useRef } from 'react';

import { useTranslation } from '@rbx/intl';
import { CircularProgress, Container, Grid, Typography } from '@rbx/ui';
import { EmptyGrid } from '@modules/miscellaneous/common';

import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ChartStyleMode } from '@rbx/analytics-ui';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import useChartStyles, { useChartErrorStateStyles } from './Chart.styles';
import { GenericChartState } from './types/ChartTypes';
import ChartHeader from './ChartHeader';
import ChartFooter from './ChartFooter';
import { getChartDefaultHeightByMode } from './options';

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
  // NOTE(shumingxu, 04/26/2024): Gradually move towards using isNoDataAvailable over showNoDataMessage
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
  // eslint-disable-next-line deprecation/deprecation -- TODO(shumingxu): Remove in DSA-4491
  isNoDataAvailable,
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
  if (isNoDataAvailable) {
    return wrapped(
      <ErrorStateContainer chartHeight={errorStateChartHeight} chartStyleMode={chartStyleMode}>
        <Typography align='center'>
          {translate(
            translationKey('Message.NoDataForSelectedFilter', TranslationNamespace.Analytics),
          )}
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
