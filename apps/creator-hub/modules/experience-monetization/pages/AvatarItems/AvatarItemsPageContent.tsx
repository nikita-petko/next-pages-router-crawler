import { useMemo } from 'react';
import { withTranslation } from '@rbx/intl';
import { CircularProgress } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { analyticsItemMonetizationAvatarItemsNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import SingleAssociatedItemTypeContentContainer from '@modules/creations/associatedItems/containers/SingleAssociatedItemTypeContentContainer';
import CreatorAnalyticsLayout from '@modules/experience-analytics-shared/components/RAQIV2/layout/CreatorAnalyticsLayout';
import useOwner from '@modules/experience-analytics-shared/context/useOwner';
import { useAnalyticsExperiencePermissions } from '@modules/experience-analytics-shared/hooks/useAnalyticsPermissions';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { ExperienceAnalyticsTabbedPageLayout } from '@modules/experience-analytics-shared/layout/NonConfigurationBasedExperienceAnalyticsTabbedPageLayout';
import { Item } from '@modules/miscellaneous/common';
import { EmptyGrid } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useUniversePermissions } from '@modules/react-query/organizations';
import ItemMonetizationTabs from '../../constants/ItemMonetizationTabs';
import { useItemMonetizationClient } from '../../context/ItemMonetizationClientProvider';
import getTransactionPageUrl from '../../utils/getTransactionPageUrl';
import buildCommissionAvatarPageConfig from './buildCommissionAvatarPageConfig';

function AvatarItemsPageContent() {
  const { translate } = useRAQIV2TranslationDependencies();
  const { id: universeId, isLoading: isLoadingUniverse } = useUniverseResource();
  const { userCanViewAnalyticsForUniverse, isPending: isPendingAnalyticsExperiencePermissions } =
    useAnalyticsExperiencePermissions(universeId);
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

  if (isPendingAnalyticsExperiencePermissions || isLoadingPermissions || isLoadingUniverse) {
    return (
      <EmptyGrid>
        <CircularProgress color='secondary' />
      </EmptyGrid>
    );
  }

  return (
    // oxlint-disable-next-line typescript/no-deprecated -- DSA-3201 to migrate
    <ExperienceAnalyticsTabbedPageLayout
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
