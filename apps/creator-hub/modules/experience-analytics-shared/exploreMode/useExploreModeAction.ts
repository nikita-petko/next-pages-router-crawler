import { useMemo } from 'react';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { TimeSeriesAnnotation } from '@modules/charts-generic/charts/types/Annotations';
import { analyticsExploreNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import buildExperienceAnalyticsUrlWithParams from '@modules/charts-generic/utils/analyticsUrlBuilder';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { ChartConfigOrPredefinedKey } from '../constants/RAQIV2PredefinedChartConfig';
import { useUniverseResource } from '../hooks/useChartResourceProvider';
import useRAQIV2TranslationDependencies from '../hooks/useRAQIV2TranslationDependencies';
import type RAQIV2ChartContext from '../types/RAQIV2ChartContext';
import useExploreModeUrlParams from './useExploreModeUrlParams';

// Resolves the Explore CTA target for a chart. Callers render this as a single
// native link-styled control (a `kind: 'link'` header action -> `<a>`); they
// must NOT wrap a `<button>` in a `Link`. Nesting `<button>` inside `<a>` is
// invalid markup that Chromium mishandles during history navigation, which
// broke the browser Back button after entering Explore (Firefox tolerated it).
const useExploreModeAction = (
  preset: ChartConfigOrPredefinedKey | null,
  chartContextOverride?: RAQIV2ChartContext,
  visibleTimeSeriesAnnotations?: readonly TimeSeriesAnnotation[],
) => {
  const { translate } = useRAQIV2TranslationDependencies();
  const params = useExploreModeUrlParams(
    preset,
    chartContextOverride,
    visibleTimeSeriesAnnotations,
  );
  const { id: universeId } = useUniverseResource();

  const href = useMemo(() => {
    return params
      ? buildExperienceAnalyticsUrlWithParams(analyticsExploreNavigationItem, params, universeId)
      : null;
  }, [params, universeId]);

  const { label, tooltip } = useMemo(
    () => ({
      label: translate(translationKey('Heading.Explore', TranslationNamespace.Navigation)),
      tooltip: translate(
        translationKey('Description.ExploreModeButton', TranslationNamespace.Analytics),
      ),
    }),
    [translate],
  );

  return useMemo(() => {
    return href
      ? {
          label,
          tooltip,
          href,
        }
      : undefined;
  }, [href, label, tooltip]);
};
export default useExploreModeAction;
