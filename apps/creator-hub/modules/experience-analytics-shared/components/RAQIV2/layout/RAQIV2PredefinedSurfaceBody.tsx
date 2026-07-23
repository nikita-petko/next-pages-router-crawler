import React, { useMemo } from 'react';
import { Grid, Typography } from '@rbx/ui';
import useIsPageContentEligible from '../../../hooks/useIsPageContentEligible';
import useOnSelectChartRegion from '../../../hooks/useOnSelectChartRegion';
import useRAQIV2TranslationDependencies from '../../../hooks/useRAQIV2TranslationDependencies';
import type RAQIV2ChartContext from '../../../types/RAQIV2ChartContext';
import type { CreatorAnalyticsPageSurfaceConfig } from '../../../types/RAQIV2PageConfig';
import getStableKey from '../../../utils/getStableKey';
import AnalyticsConfigurableComponent from './AnalyticsConfigurableComponent';

const RAQIV2PredefinedSurfaceBody = ({
  config,
  chartContext,
}: {
  config: CreatorAnalyticsPageSurfaceConfig;
  chartContext: RAQIV2ChartContext;
}) => {
  const { eligibility, body: chartKeys } = config;
  const { translate } = useRAQIV2TranslationDependencies();

  const hasEligibilityConfig = !!eligibility;
  const isEligible = useIsPageContentEligible(eligibility) || !hasEligibilityConfig;

  const onSelectChartRegion = useOnSelectChartRegion();

  const body = useMemo(() => {
    if (!isEligible) {
      if (hasEligibilityConfig) {
        const { ineligibleMessage } = eligibility;
        return [
          <Grid item key='ineligibleMessage'>
            <Typography>{translate(ineligibleMessage)}</Typography>
          </Grid>,
        ];
      }
      // NOTE(gperkins@20240521): Should never be ineligible if there isn't a config, but TS can't tell
      return null;
    }
    return chartKeys.map((key) => (
      <AnalyticsConfigurableComponent
        key={getStableKey(key)}
        component={key}
        chartContext={chartContext}
        onSelectChartRegion={onSelectChartRegion}
      />
    ));
  }, [
    chartContext,
    chartKeys,
    eligibility,
    hasEligibilityConfig,
    isEligible,
    onSelectChartRegion,
    translate,
  ]);

  return body;
};

export default RAQIV2PredefinedSurfaceBody;
