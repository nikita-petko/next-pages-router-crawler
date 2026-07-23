import type { FunctionComponent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { CircularProgress, Grid, Typography } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import useAnalyticsPageSummaryStyles from '@modules/charts-generic/layout/AnalyticsPageSummary.styles';
import { useUniversePerformanceRaqiClientProvider } from '@modules/experience-analytics-shared/context/UniversePerformanceRaqiClientProvider';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import useLiveConcurrentPlayerStats from '@modules/experience-analytics-shared/hooks/useLiveConcurrentPlayerStats';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { EmptyGrid } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useCCUSummaryStyles from './CCUSummary.styles';
import CCUSummaryItem, { CCUSummaryType } from './CCUSummaryItem';

// Note(shumingxu, 07/28/2023): We need to use our own "breakpoint" on the component width
// due to navbar making the uiblox breakpoints inconsistent to the actual width of the table
const ComponentBreakpointWidth = 1123;

const CCUSummary: FunctionComponent = () => {
  const { id: universeId } = useUniverseResource();
  const { translate } = useRAQIV2TranslationDependencies();
  const { universePerformanceRaqiClient } = useUniversePerformanceRaqiClientProvider();

  const [isLargeWidth, setIsLargeWidth] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const [gridRows, setGridRows] = useState<number>(1);
  const {
    classes: { summaryContainer, loadingContainer },
  } = useAnalyticsPageSummaryStyles();
  const {
    classes: { breakdownStatsContainer, breakdownStatsContainerWrapper },
  } = useCCUSummaryStyles({
    large: isLargeWidth,
  });

  const { summary, serverCount, isLoading, hasError } = useLiveConcurrentPlayerStats(
    universeId,
    universePerformanceRaqiClient,
  );

  const CalculateBreakpoint = () => {
    if (containerRef.current === null || rowRef.current === null) {
      setGridRows(0);
      return;
    }
    const rowHeight = rowRef.current.clientHeight;
    const rowWidth = containerRef.current.clientWidth;
    setIsLargeWidth(rowWidth >= ComponentBreakpointWidth);
    if (containerRef.current.clientHeight < rowHeight * 1.5) {
      setGridRows(1);
    } else if (containerRef.current.clientHeight < rowHeight * 2.5) {
      setGridRows(2);
    } else {
      setGridRows(3);
    }
  };
  useEffect(() => {
    window.addEventListener('resize', CalculateBreakpoint);

    return () => {
      window.removeEventListener('resize', CalculateBreakpoint);
    };
  }, []);
  useEffect(CalculateBreakpoint);

  const getGridJustification = () => {
    if (gridRows === 1) {
      return 'flex-end';
    }
    if (gridRows === 2) {
      return 'space-between';
    }
    return 'flex-start';
  };

  if (isLoading) {
    return (
      <div className={loadingContainer}>
        <EmptyGrid>
          <CircularProgress />
        </EmptyGrid>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={loadingContainer}>
        <EmptyGrid>
          <Typography color='secondary' align='center' variant='body2'>
            {translate(translationKey('Message.CCUSummaryError', TranslationNamespace.Analytics))}
          </Typography>
        </EmptyGrid>
      </div>
    );
  }

  return (
    <Grid container className={summaryContainer} justifyContent='space-between' ref={containerRef}>
      <Grid item ref={rowRef}>
        <CCUSummaryItem
          type={CCUSummaryType.Total}
          value={summary?.total ?? 0}
          totalServerCount={serverCount}
          isLarge={isLargeWidth}
        />
      </Grid>
      <Grid item XSmall className={breakdownStatsContainerWrapper}>
        <Grid container justifyContent={getGridJustification()} className={breakdownStatsContainer}>
          <CCUSummaryItem
            type={CCUSummaryType.Computer}
            value={summary?.computer ?? 0}
            isLarge={isLargeWidth}
          />
          <CCUSummaryItem
            type={CCUSummaryType.Phone}
            value={summary?.phone ?? 0}
            isLarge={isLargeWidth}
          />
          <CCUSummaryItem
            type={CCUSummaryType.Tablet}
            value={summary?.tablet ?? 0}
            isLarge={isLargeWidth}
          />
          <CCUSummaryItem
            type={CCUSummaryType.Console}
            value={summary?.console ?? 0}
            isLarge={isLargeWidth}
          />
          <CCUSummaryItem
            type={CCUSummaryType.Vr}
            value={summary?.vr ?? 0}
            isLarge={isLargeWidth}
          />
          <CCUSummaryItem
            type={CCUSummaryType.Tv}
            value={summary?.tv ?? 0}
            isLarge={isLargeWidth}
          />
        </Grid>
      </Grid>
    </Grid>
  );
};

export default CCUSummary;
