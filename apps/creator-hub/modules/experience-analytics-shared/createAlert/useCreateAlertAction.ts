import { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { analyticsAlertCreationNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import buildExperienceAnalyticsUrlWithParams from '@modules/charts-generic/utils/analyticsUrlBuilder';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useUniverseResource } from '../hooks/useChartResourceProvider';
import type RAQIV2ChartSpec from '../types/RAQIV2ChartSpec';
import useCreateAlertUrlParams from './useCreateAlertUrlParams';

export type CreateAlertAction = {
  readonly label: string;
  /** Absolute `/alerts/create?...` deep link; meant to be opened in a new tab. */
  readonly href: string;
};

/**
 * Resolves the "Create alert" chart-header action: a deep link to the
 * create-alert page pre-filled from the chart `spec`'s metric, granularity,
 * filters, and breakdown. Returns `undefined` when the user/universe/metric are
 * not eligible (see {@link useCreateAlertUrlParams}), so the caller can omit the
 * button entirely.
 */
const useCreateAlertAction = (spec: RAQIV2ChartSpec | null): CreateAlertAction | undefined => {
  const params = useCreateAlertUrlParams(spec);
  const { id: universeId } = useUniverseResource();
  const { translate } = useTranslationWrapper(useTranslation());

  const href = useMemo(
    () =>
      params
        ? buildExperienceAnalyticsUrlWithParams(
            analyticsAlertCreationNavigationItem,
            params,
            universeId,
          )
        : null,
    [params, universeId],
  );

  const label = useMemo(
    () => translate(translationKey('Action.CreateAlertFromChart', TranslationNamespace.Analytics)),
    [translate],
  );

  return useMemo(() => (href ? { label, href } : undefined), [href, label]);
};

export default useCreateAlertAction;
