import React, { FC, PropsWithChildren, useCallback, useMemo } from 'react';
import {
  analyticsExploreNavigationItem,
  buildExperienceAnalyticsUrlWithParams,
  useIsInAnalyticsExploreMode,
} from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Link } from '@modules/miscellaneous/common';
import RAQIV2ChartContext from '../types/RAQIV2ChartContext';
import { useUniverseResource } from '../hooks/useChartResourceProvider';
import useExploreModeUrlParams from './useExploreModeUrlParams';
import useRAQIV2TranslationDependencies from '../hooks/useRAQIV2TranslationDependencies';
import emptyFunction from '../emptyFunction';
import { ChartConfigOrPredefinedKey } from '../constants/RAQIV2PredefinedChartConfig';

const useExploreModeAction = (
  preset: ChartConfigOrPredefinedKey | null,
  chartContextOverride?: RAQIV2ChartContext,
) => {
  const inExploreMode = useIsInAnalyticsExploreMode();
  const { translate } = useRAQIV2TranslationDependencies();
  const params = useExploreModeUrlParams(preset, chartContextOverride);
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
      if (!href) return undefined;
      return <Link href={href}>{children}</Link>;
    },
    [href],
  );

  return useMemo(() => {
    if (inExploreMode) return undefined;
    return href
      ? {
          label,
          onClick: emptyFunction,
          tooltip,
          Wrapper: ExploreModeLinkWrapper,
        }
      : undefined;
  }, [inExploreMode, ExploreModeLinkWrapper, href, label, tooltip]);
};
export default useExploreModeAction;
