import { useMemo, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import type { TranslationKey } from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import {
  formatSmoothingChartTitleLabel,
  smoothingChartTitleTranslationKey,
} from '@modules/experience-analytics-shared/components/chartConfigurator/chartConfiguratorPreviewTitle';
import { UNTITLED_FORMULA_TRANSLATION_KEY } from '@modules/experience-analytics-shared/utils/metricLikeSemantics';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
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
      formatSmoothingChartTitleLabel(tPendingTranslation, metricName);
    const translateTitleKey = (titleKey: TranslationKey) => String(translate(titleKey));
    const titleRevisionProbe = '__title-revision-probe__';
    const untitledFormulaLabel = String(
      tPendingTranslation(
        '(Untitled formula)',
        'Default name shown for a formula that has not been named yet.',
        translationKey('Label.ExploreMode.UntitledFormula', TranslationNamespace.Analytics),
      ),
    );
    return {
      formatSmoothingTitleLabel,
      translateTitleKey,
      untitledFormulaLabel,
      revision: [
        ready ? 'ready' : 'pending',
        formatSmoothingTitleLabel(titleRevisionProbe),
        translateTitleKey(smoothingChartTitleTranslationKey),
        translateTitleKey(UNTITLED_FORMULA_TRANSLATION_KEY),
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
