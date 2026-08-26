import { useMemo, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import type { TranslationKey } from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import {
  formatEnglishSmoothingChartTitleLabel,
  formatSmoothingChartTitleLabel,
  smoothingChartTitleTranslationKey,
} from '@modules/experience-analytics-shared/components/chartConfigurator/chartConfiguratorPreviewTitle';
import type { CustomDashboardConfig } from '../types';
import { stabilizeSynthesisResult } from './stabilizeSynthesis';
import {
  createSynthesisTileCache,
  synthesize,
  type ChartTitleResolution,
  type SynthesizeOptions,
  type SynthesizeResult,
} from './synthesize';

type SynthesisCache = {
  readonly config: CustomDashboardConfig;
  readonly result: SynthesizeResult;
};

type SynthesisResultStabilizer = {
  readonly stabilize: (
    config: CustomDashboardConfig,
    freshResult: SynthesizeResult,
  ) => SynthesizeResult;
};

function createSynthesisResultStabilizer(): SynthesisResultStabilizer {
  let cache: SynthesisCache | null = null;

  return {
    stabilize(config, freshResult) {
      const result =
        cache === null
          ? freshResult
          : stabilizeSynthesisResult(cache.config, cache.result, config, freshResult);
      cache = { config, result };
      return result;
    },
  };
}

/**
 * Memoized wrapper around `synthesize()` with per-tile component identity
 * stabilization across config updates (e.g. removing one chart tile).
 */
export default function useDashboardSynthesis(
  config: CustomDashboardConfig,
  options?: SynthesizeOptions,
): SynthesizeResult {
  const [tileCache] = useState(createSynthesisTileCache);
  const [resultStabilizer] = useState(createSynthesisResultStabilizer);
  const optionsTileCache = options?.tileCache;
  const { translate, tPendingTranslation, ready } = useTranslationWrapper(useTranslation());
  const chartTitleResolution = useMemo((): ChartTitleResolution => {
    const formatSmoothingTitleLabel = (metricName: string) =>
      typeof tPendingTranslation === 'function'
        ? formatSmoothingChartTitleLabel(tPendingTranslation, metricName)
        : formatEnglishSmoothingChartTitleLabel(metricName);
    const translateTitleKey = (titleKey: TranslationKey) =>
      typeof translate === 'function' ? String(translate(titleKey)) : titleKey.key;
    const titleRevisionProbe = '__title-revision-probe__';
    return {
      formatSmoothingTitleLabel,
      translateTitleKey,
      revision: [
        ready ? 'ready' : 'pending',
        formatSmoothingTitleLabel(titleRevisionProbe),
        translateTitleKey(smoothingChartTitleTranslationKey),
      ].join(':'),
    };
  }, [ready, tPendingTranslation, translate]);
  const freshResult = useMemo(
    () =>
      synthesize(config, {
        tileCache: optionsTileCache ?? tileCache,
        chartTitleResolution: options?.chartTitleResolution ?? chartTitleResolution,
      }),
    [chartTitleResolution, config, options?.chartTitleResolution, optionsTileCache, tileCache],
  );

  return useMemo(
    () => resultStabilizer.stabilize(config, freshResult),
    [config, freshResult, resultStabilizer],
  );
}
