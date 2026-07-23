import type { FC, PropsWithChildren } from 'react';
import { useCallback, useMemo } from 'react';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { TimeSeriesAnnotation } from '@modules/charts-generic/charts/types/Annotations';
import { analyticsExploreNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import buildExperienceAnalyticsUrlWithParams from '@modules/charts-generic/utils/analyticsUrlBuilder';
import { Link } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { ChartConfigOrPredefinedKey } from '../constants/RAQIV2PredefinedChartConfig';
import emptyFunction from '../emptyFunction';
import { useUniverseResource } from '../hooks/useChartResourceProvider';
import useRAQIV2TranslationDependencies from '../hooks/useRAQIV2TranslationDependencies';
import type RAQIV2ChartContext from '../types/RAQIV2ChartContext';
import useExploreModeUrlParams from './useExploreModeUrlParams';

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

  const ExploreModeLinkWrapper = useCallback<FC<PropsWithChildren>>(
    ({ children }) => {
      if (!href) {
        return undefined;
      }
      return (
        <Link href={href} underline='none'>
          {children}
        </Link>
      );
    },
    [href],
  );

  return useMemo(() => {
    return href
      ? {
          label,
          onClick: emptyFunction,
          tooltip,
          href,
          Wrapper: ExploreModeLinkWrapper,
        }
      : undefined;
  }, [ExploreModeLinkWrapper, href, label, tooltip]);
};
export default useExploreModeAction;
