import { Fragment, useMemo } from 'react';
import { analyticsItemMonetizationPassesNavigationItem } from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { withTranslation } from '@rbx/intl';
import {
  CreatorAnalyticsLayout,
  ExperienceAnalyticsTabbedPageLayout,
  useOwner,
  useRAQIV2TranslationDependencies,
} from '@modules/experience-analytics-shared';
import { EmptyGrid } from '@modules/miscellaneous/common';
import { CircularProgress } from '@rbx/ui';
import GamePassesRegionalPricingPromotionBanner from '@modules/regional-pricing/components/RegionalPricingPromotionBanner/GamePassesRegionalPricingPromotionBanner';
import GamePassesTableContainer from '@modules/passes/containers/GamePassesTableContainer';
import { useUniversePermissions } from '@modules/react-query/organizations';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import ItemMonetizationTabs from '../../constants/ItemMonetizationTabs';
import buildGamePassPageConfig from './buildGamePassPageConfig';
import { useItemMonetizationClient } from '../../context/ItemMonetizationClientProvider';
import getTransactionPageUrl from '../../utils/getTransactionPageUrl';

function GamePassesPageContent({ universeId }: { universeId: number }) {
  const { translate } = useRAQIV2TranslationDependencies();
  const client = useItemMonetizationClient();

  const { data: permissions, isLoading: isLoadingPermissions } = useUniversePermissions(universeId);
  const { userCanViewAnalyticsForUniverse, isGamePassBonusPromotionsTableEnabled, isFetched } =
    useFeatureFlagsForNamespace(
      ['userCanViewAnalyticsForUniverse', 'isGamePassBonusPromotionsTableEnabled'],
      FeatureFlagNamespace.Analytics,
    );

  const creationsTab = useMemo(
    () => ({
      key: ItemMonetizationTabs.Creations,
      label: translate(translationKey('Heading.Creations', TranslationNamespace.Navigation)),
      content: <GamePassesTableContainer universeId={universeId} />,
    }),
    [translate, universeId],
  );

  const owner = useOwner();

  const transactionPageUrl = useMemo(() => getTransactionPageUrl(owner), [owner]);

  const itemMonetizationPageConfig = useMemo(
    () =>
      buildGamePassPageConfig(
        universeId,
        client,
        transactionPageUrl,
        isGamePassBonusPromotionsTableEnabled,
      ),
    [universeId, client, transactionPageUrl, isGamePassBonusPromotionsTableEnabled],
  );

  const analyticsTab = useMemo(
    () => ({
      key: ItemMonetizationTabs.Analytics,
      label: translate(translationKey('Heading.Analytics', TranslationNamespace.Analytics)),
      content: <CreatorAnalyticsLayout config={itemMonetizationPageConfig} />,
    }),
    [itemMonetizationPageConfig, translate],
  );

  const orderedTabs = useMemo(() => {
    const tabs = [];
    if (permissions?.monetizeExperience) {
      tabs.push(creationsTab);
    }
    if (userCanViewAnalyticsForUniverse) {
      tabs.push(analyticsTab);
    }
    return tabs;
  }, [permissions, userCanViewAnalyticsForUniverse, creationsTab, analyticsTab]);

  const description = useMemo(
    () => (
      <Fragment>
        {universeId && (
          <GamePassesRegionalPricingPromotionBanner
            universeId={universeId}
            className='margin-y-none medium:margin-bottom-[-2px]'
          />
        )}
      </Fragment>
    ),
    [universeId],
  );

  if (!isFetched || isLoadingPermissions) {
    return (
      <EmptyGrid>
        <CircularProgress color='secondary' />
      </EmptyGrid>
    );
  }

  return (
    // eslint-disable-next-line deprecation/deprecation -- DSA-3203 to migrate
    <ExperienceAnalyticsTabbedPageLayout
      description={description}
      controls={[]}
      tabs={orderedTabs}
      navigationItem={analyticsItemMonetizationPassesNavigationItem}
    />
  );
}

export default withTranslation(GamePassesPageContent, [
  TranslationNamespace.Navigation,
  TranslationNamespace.Analytics,
  TranslationNamespace.AssetTypes,
  TranslationNamespace.AvatarAnalytics,
]);
