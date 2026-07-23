import { useCallback, useState, useEffect, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import type { FormattedText } from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import type {
  LoadingPlaceholderConfig,
  SingleChoiceConfig,
} from '@modules/experience-analytics-shared/layout/ExperienceAnalyticsPageControlBar/ExperienceAnalyticsPageFilterBarConfig';
import { NonRAQIUIDimension as FilterBarDimension } from '@modules/experience-analytics-shared/layout/ExperienceAnalyticsPageControlBar/filterUtils';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useExperienceSubscriptionsClientProvider } from './ExperienceSubscriptionsClientProvider';

const useSubscriptionFilterBarConfig = () => {
  const [subscriptionFilterBarIsLoading, setSubscriptionBarIsLoading] = useState(true);
  const [subscriptionFilterBarValues, setSubscriptionFilterBarValues] = useState<Array<string>>([]);
  const [subscriptionIdToNameMapping, setSubscriptionIdToNameMapping] = useState<
    Map<string, string>
  >(new Map());

  const { translate } = useTranslationWrapper(useTranslation());
  const { id: universeId } = useUniverseResource();
  const { experienceSubscriptionsClient } = useExperienceSubscriptionsClientProvider();

  const getSubscriptionsForUniverse = useCallback(async () => {
    if (universeId <= 0) {
      return;
    }
    setSubscriptionBarIsLoading(true);

    try {
      const { developerSubscriptions } =
        await experienceSubscriptionsClient.getExperienceSubscriptions(universeId, '');
      const ids = developerSubscriptions?.map((product) => product.id ?? '') ?? [];
      const idToNameMapping = new Map(
        developerSubscriptions?.map((product) => [product.id ?? '', product.name ?? '']),
      );

      setSubscriptionFilterBarValues(ids);
      setSubscriptionIdToNameMapping(idToNameMapping);
    } catch {
      // If they don't have access to subscriptions then we can just ignore
    }
    setSubscriptionBarIsLoading(false);
  }, [universeId, experienceSubscriptionsClient]);

  useEffect(() => {
    getSubscriptionsForUniverse();
  }, [getSubscriptionsForUniverse]);

  const allSubscriptionsInExperienceOption = useMemo(() => {
    return translate(
      translationKey('Label.AllSubscriptions', TranslationNamespace.ExperienceSubscriptions),
    );
  }, [translate]);

  const subscriptionFilterBarConfig: LoadingPlaceholderConfig | SingleChoiceConfig<string> =
    useMemo(() => {
      if (subscriptionFilterBarIsLoading) {
        return {
          type: 'loading',
          dimension: FilterBarDimension.Subscription,
          dimensionNameKey: translationKey(
            'Label.Subscription',
            TranslationNamespace.ExperienceSubscriptions,
          ),
        };
      }
      return {
        type: 'single',
        dimension: FilterBarDimension.Subscription,
        dimensionNameKey: translationKey(
          'Label.Subscription',
          TranslationNamespace.ExperienceSubscriptions,
        ),
        options: [allSubscriptionsInExperienceOption, ...subscriptionFilterBarValues],
        blankOption: allSubscriptionsInExperienceOption,
        renderOption: (opt: string) =>
          opt === allSubscriptionsInExperienceOption
            ? (opt as FormattedText)
            : (subscriptionIdToNameMapping.get(opt) as FormattedText),
      };
    }, [
      allSubscriptionsInExperienceOption,
      subscriptionFilterBarIsLoading,
      subscriptionFilterBarValues,
      subscriptionIdToNameMapping,
    ]);

  return subscriptionFilterBarConfig;
};
export default useSubscriptionFilterBarConfig;
