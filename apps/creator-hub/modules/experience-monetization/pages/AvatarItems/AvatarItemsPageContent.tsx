import { useMemo } from 'react';
import {
  AnalyticsPageDescription,
  AnalyticsDocLink,
  AnalyticsPageTitle,
  analyticsItemMonetizationAvatarItemsNavigationItem,
} from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { withTranslation } from '@rbx/intl';
import {
  CreatorAnalyticsLayout,
  ExperienceAnalyticsTabbedPageLayout,
  useOwner,
  useRAQIV2TranslationDependencies,
  useUniverseResource,
} from '@modules/experience-analytics-shared';
import { EmptyGrid, Item, Link } from '@modules/miscellaneous/common';
import { SingleAssociatedItemTypeContentContainer } from '@modules/creations';
import { CircularProgress } from '@rbx/ui';
import { useUniversePermissions } from '@modules/react-query/organizations';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import ItemMonetizationTabs from '../../constants/ItemMonetizationTabs';
import buildCommissionAvatarPageConfig from './buildCommissionAvatarPageConfig';
import { useItemMonetizationClient } from '../../context/ItemMonetizationClientProvider';
import getTransactionPageUrl from '../../utils/getTransactionPageUrl';

const avatarItemsDocLink: AnalyticsDocLink = '/docs/production/monetization/avatar-items';

const makeTakeActionLink = (chunks: React.ReactNode) => {
  return (
    <Link href={avatarItemsDocLink} target='_blank' underline='none'>
      {chunks}
    </Link>
  );
};

function AvatarItemsPageContent() {
  const { translate, translateHTML } = useRAQIV2TranslationDependencies();
  const { userCanViewAnalyticsForUniverse, isFetched } = useFeatureFlagsForNamespace(
    'userCanViewAnalyticsForUniverse',
    FeatureFlagNamespace.Analytics,
  );
  const { id: universeId, isLoading: isLoadingUniverse } = useUniverseResource();
  const { data: permissions, isLoading: isLoadingPermissions } = useUniversePermissions(universeId);
  const client = useItemMonetizationClient();
  const owner = useOwner();
  const transactionPageUrl = useMemo(() => getTransactionPageUrl(owner), [owner]);

  const creationsTab = useMemo(
    () => ({
      key: ItemMonetizationTabs.Creations,
      label: translate(translationKey('Heading.LinkedItems', TranslationNamespace.Analytics)),
      content: <SingleAssociatedItemTypeContentContainer itemType={Item.CatalogAsset} />,
    }),
    [translate],
  );
  const itemMonetizationPageConfig = useMemo(
    () => buildCommissionAvatarPageConfig(universeId, client, transactionPageUrl),
    [universeId, client, transactionPageUrl],
  );

  const analyticsTab = useMemo(
    () => ({
      key: ItemMonetizationTabs.Analytics,
      label: translate(translationKey('Heading.Analytics', TranslationNamespace.Analytics)),
      content: <CreatorAnalyticsLayout config={itemMonetizationPageConfig} />,
    }),
    [itemMonetizationPageConfig, translate],
  );

  const title = useMemo(
    () => (
      <AnalyticsPageTitle
        text={translate(
          translationKey('Heading.AvatarItems', TranslationNamespace.AvatarAnalytics),
        )}
      />
    ),
    [translate],
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
      <AnalyticsPageDescription
        text={translateHTML(
          translationKey(
            'Description.TakeActionAvatarItemCommissions',
            TranslationNamespace.Analytics,
          ),
          [
            {
              opening: 'linkStart',
              closing: 'linkEnd',
              content: makeTakeActionLink,
            },
          ],
        )}
      />
    ),
    [translateHTML],
  );

  if (!isFetched || isLoadingPermissions || isLoadingUniverse) {
    return (
      <EmptyGrid>
        <CircularProgress color='secondary' />
      </EmptyGrid>
    );
  }

  return (
    // eslint-disable-next-line deprecation/deprecation -- DSA-3201 to migrate
    <ExperienceAnalyticsTabbedPageLayout
      title={title}
      description={description}
      controls={[]}
      tabs={orderedTabs}
      navigationItem={analyticsItemMonetizationAvatarItemsNavigationItem}
    />
  );
}

export default withTranslation(AvatarItemsPageContent, [
  TranslationNamespace.Navigation,
  TranslationNamespace.Analytics,
  TranslationNamespace.AvatarAnalytics,
]);
