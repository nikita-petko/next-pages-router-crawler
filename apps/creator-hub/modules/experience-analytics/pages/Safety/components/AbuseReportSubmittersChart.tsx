import React, { useMemo } from 'react';
import type { SelectionCallback } from '@rbx/analytics-ui';
import { SingleChartCardContainer } from '@rbx/analytics-ui';
import { RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import { Typography } from '@rbx/ui';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import genericChartStateToChartAbnormalState from '@modules/experience-analytics-shared/components/RAQIV2/genericChartStateToChartAbnormalState';
import AnalyticsConfigurableComponent from '@modules/experience-analytics-shared/components/RAQIV2/layout/AnalyticsConfigurableComponent';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import type RAQIV2ChartContext from '@modules/experience-analytics-shared/types/RAQIV2ChartContext';
import { ChartOverlay } from '@modules/experience-analytics-shared/types/RAQIV2ChartSpec';
import { RAQIV2SpecialLayoutType } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useGetAbuseReportSubmittersEligibility from '../hooks/useGetAbuseReportSubmittersEligibility';

const chartConfigAbuseReportSubmitters = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey(
    'Label.Metric.UniqueAbuseReportSubmittersPer1000PlaytimeHours',
    TranslationNamespace.Safety,
  ),
  definitionTooltipKey: translationKey(
    'Description.UniqueAbuseReportSubmittersPer1000PlaytimeHours',
    TranslationNamespace.Safety,
  ),
  metric: RAQIV2Metric.UniqueAbuseReportSubmittersPer1000PlaytimeHours,
  overrides: {},
  chartType: ChartType.Spline,
  overlays: [ChartOverlay.benchmark()],
} as const;

const ABNORMAL_STATE_DEFAULT_HEIGHT = 400;

const AbuseReportSubmittersChart: React.FC<{
  chartContext: RAQIV2ChartContext;
  onSelectChartRegion: null | SelectionCallback<number>;
}> = ({ chartContext, onSelectChartRegion }) => {
  const { translate, tPendingTranslation } = useRAQIV2TranslationDependencies();

  const eligibilityStatus = useGetAbuseReportSubmittersEligibility(chartContext);
  const { title, tooltip, insufficientDataHeading, insufficientDataSubheading } = useMemo(() => {
    return {
      title: translate(chartConfigAbuseReportSubmitters.titleKey),
      tooltip: translate(chartConfigAbuseReportSubmitters.definitionTooltipKey),
      insufficientDataHeading: translate(
        translationKey('Label.MoreDataNeeded', TranslationNamespace.Analytics),
      ),
      insufficientDataSubheading: translate(
        translationKey(
          'Message.MetricRequiresMinimum1000HoursPlaytime',
          TranslationNamespace.Analytics,
        ),
      ),
    };
  }, [translate]);

  const insufficientDataIcon = useMemo(() => {
    return (
      <svg width='115' height='115' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <path
          d='M57.5 26.75C64.9558 26.75 71 32.7942 71 40.25V43.75H75.5L75.8477 43.7588C79.414 43.9397 82.25 46.8887 82.25 50.5V77.9688L82.2383 78.2861C82.1259 79.8629 81.1795 81.2579 79.6748 81.7959L78.9316 82.0537C74.989 83.3826 67.6448 85.25 57.5 85.25L56.4951 85.2441C46.2056 85.1183 38.9278 83.0839 35.3252 81.7959C33.7203 81.222 32.75 79.6732 32.75 77.9688V50.5C32.75 46.8887 35.586 43.9397 39.1523 43.7588L39.5 43.75H44V40.25C44 32.7942 50.0442 26.75 57.5 26.75ZM39.5 46.75C37.4289 46.75 35.75 48.4289 35.75 50.5V77.9688C35.75 78.5594 36.062 78.8741 36.335 78.9717C39.7824 80.2042 47.075 82.25 57.5 82.25C67.925 82.25 75.2176 80.2042 78.665 78.9717C78.938 78.8741 79.25 78.5594 79.25 77.9688V50.5C79.25 48.4289 77.5711 46.75 75.5 46.75H39.5ZM57.5 57C58.3284 57 59 57.6716 59 58.5V70.5C59 71.3284 58.3284 72 57.5 72C56.6716 72 56 71.3284 56 70.5V58.5C56 57.6716 56.6716 57 57.5 57ZM57.5 29.75C51.701 29.75 47 34.451 47 40.25V43.75H68V40.25C68 34.451 63.299 29.75 57.5 29.75Z'
          fill='#F7F7F8'
        />
      </svg>
    );
  }, []);

  const abnormalStateLayout = useMemo(() => {
    return <div style={{ height: ABNORMAL_STATE_DEFAULT_HEIGHT }} />;
  }, []);

  const insufficientDataLayout = useMemo(() => {
    return (
      <div
        style={{
          height: ABNORMAL_STATE_DEFAULT_HEIGHT,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'transparent',
        }}>
        {insufficientDataIcon}
        <Typography variant='h6' sx={{ marginBottom: '6px' }}>
          {insufficientDataHeading}
        </Typography>
        <Typography variant='body2' color='secondary'>
          {insufficientDataSubheading}
        </Typography>
      </div>
    );
  }, [insufficientDataHeading, insufficientDataIcon, insufficientDataSubheading]);

  const component = useMemo(() => {
    if (typeof eligibilityStatus === 'object') {
      const abnormalState = genericChartStateToChartAbnormalState({
        state: eligibilityStatus,
        hasNoData: false,
        translate,
        tPendingTranslation,
      });

      return (
        <SingleChartCardContainer
          titleLabel={title}
          titleTooltipLabel={tooltip}
          chartSummarySpecs={[]}
          abnormalState={abnormalState}>
          {abnormalStateLayout}
        </SingleChartCardContainer>
      );
    }

    if (eligibilityStatus) {
      return (
        <AnalyticsConfigurableComponent
          component={{
            type: RAQIV2SpecialLayoutType.FullWidthLayout,
            items: [chartConfigAbuseReportSubmitters],
          }}
          chartContext={chartContext}
          onSelectChartRegion={onSelectChartRegion}
        />
      );
    }

    return (
      <SingleChartCardContainer
        titleLabel={title}
        titleTooltipLabel={tooltip}
        chartSummarySpecs={[]}>
        {insufficientDataLayout}
      </SingleChartCardContainer>
    );
  }, [
    eligibilityStatus,
    title,
    tooltip,
    insufficientDataLayout,
    translate,
    tPendingTranslation,
    abnormalStateLayout,
    chartContext,
    onSelectChartRegion,
  ]);

  return component;
};

export default AbuseReportSubmittersChart;
