import { useCallback, useState, useEffect, useMemo } from 'react';
import {
  translationKey,
  FormattedText,
  useTranslationWrapper,
} from '@modules/analytics-translations';
import {
  FilterBarDimension,
  LoadingPlaceholderConfig,
  SingleChoiceConfig,
  useUniverseResource,
} from '@modules/experience-analytics-shared';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

import { useTranslation } from '@rbx/intl';
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
