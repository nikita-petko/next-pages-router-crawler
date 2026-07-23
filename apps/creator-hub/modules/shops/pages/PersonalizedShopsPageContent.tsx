/* istanbul ignore file */
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation, withTranslation } from '@rbx/intl';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ProgressCircleLoader } from '@modules/monetization-shared/loaders';
import GenericTabbedPageLayout, {
  type TabConfig,
} from '@modules/monetization-shared/tabs/GenericTabbedPageLayout';
import { useUniversePermissions } from '@modules/react-query/organizations';
import PersonalizedShopPromotionBanner from '../banners/PersonalizedShopPromotionBanner';
import { GLOBAL_ICON_ENTRY_POINT_NAME } from '../constants';
import { useHasSeenPersonalizedShops } from '../hooks/useHasSeenPersonalizedShops';
import { usePersonalizedShop } from '../hooks/usePersonalizedShop';
import ItemCatalogTabContainer from '../item-catalog/containers/ItemCatalogTabContainer';
import OverviewTabContainer from '../overview/containers/OverviewTabContainer';
import { useCreateShop } from '../queries/useCreateShop';
import { useUpdateEntryPoints } from '../queries/useUpdateEntryPoints';
import type { PersonalizedShopsTab } from '../types';

function PersonalizedShopsPageContent({ universeId }: { universeId: number }) {
  const router = useRouter();
  const { translate } = useTranslation();

  useHasSeenPersonalizedShops(universeId, { setOnMount: true });

  const {
    data: shop,
    isLoading: isShopLoading,
    isError: isShopError,
  } = usePersonalizedShop(universeId);
  const { data: permissions } = useUniversePermissions(universeId);
  const { mutate: createShop, isPending: isCreateShopPending } = useCreateShop(universeId, [
    { name: GLOBAL_ICON_ENTRY_POINT_NAME, isEnabled: false },
  ]);
  const { mutate: updateEntryPoints } = useUpdateEntryPoints(universeId);

  const shopIsMissing = !isShopLoading && !isShopError && !shop;
  const canMonetize = !!permissions?.monetizeExperience;
  const canViewShop = !!permissions?.viewAnalytics;
  const shopId = shop?.shopId;
  const noGlobalIconEntryPoint =
    !!shop && !shop.entryPoints.some((ep) => ep.name === GLOBAL_ICON_ENTRY_POINT_NAME);

  // Lazy backfill the shop config - if there is no personalized shop config yet, create it.
  useEffect(() => {
    if (shopIsMissing && (canMonetize || canViewShop)) {
      createShop();
    }
  }, [shopIsMissing, canMonetize, canViewShop, createShop]);

  // Backfill entry points for shops that were created without the global icon entry point
  useEffect(() => {
    if (noGlobalIconEntryPoint && shopId !== undefined && (canMonetize || canViewShop)) {
      updateEntryPoints({
        shopId,
        entryPoints: [{ name: GLOBAL_ICON_ENTRY_POINT_NAME, isEnabled: false }],
      });
    }
  }, [noGlobalIconEntryPoint, shopId, updateEntryPoints, canMonetize, canViewShop]);

  if (isShopLoading || isCreateShopPending) {
    return <ProgressCircleLoader />;
  }

  if (isShopError) {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
        buttonText={translate('Action.FailedToLoadPage')}
        onReload={router.reload}
      />
    );
  }

  if (!shop) {
    return (
      <EmptyState
        title={translate('Heading.ItemCatalog')}
        description={translate('Message.NoItemsFound')}
        size='small'
        illustration='chart'
      />
    );
  }

  const tabs: TabConfig<PersonalizedShopsTab>[] = [
    {
      key: 'overview',
      label: translate('Heading.Overview'),
      content: <OverviewTabContainer universeId={universeId} />,
    },
    {
      key: 'item-catalog',
      label: translate('Heading.ItemCatalog'),
      content: <ItemCatalogTabContainer universeId={universeId} shopId={shop.shopId} />,
    },
  ];

  return (
    <div className='flex flex-col gap-xxlarge margin-bottom-medium'>
      <PersonalizedShopPromotionBanner universeId={universeId} />
      <GenericTabbedPageLayout tabs={tabs} defaultTab='overview' />
    </div>
  );
}

export default withTranslation(PersonalizedShopsPageContent, [
  TranslationNamespace.Error,
  TranslationNamespace.Table,
  TranslationNamespace.Creations,
  TranslationNamespace.PersonalizedShop,
]);
