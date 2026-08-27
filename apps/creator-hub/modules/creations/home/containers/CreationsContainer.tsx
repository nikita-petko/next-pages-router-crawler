import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { SearchCreatorType } from '@rbx/client-universes-api/v1';
import { buildBreadcrumb, buildTitle, HubMeta } from '@rbx/creator-hub-history';
import { ProgressCircle } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid } from '@rbx/ui';
import {
  AgeVerificationUpsellBanner,
  AgeVerificationUpsellPage,
} from '@modules/age-verification-upsell/components/AgeVerificationUpsellBanner';
import AudienceReachGrowthOpportunitiesBanner from '@modules/audience-reach/components/AudienceReachGrowthOpportunitiesBanner';
import type { TGroup, TUser } from '@modules/authentication/types';
import { Asset } from '@modules/miscellaneous/common';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import { readQueryValue } from '@modules/miscellaneous/utils/queryToString';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import ToolboxServiceApiRoot from '@modules/toolboxService/ToolboxServiceApiProvider';
import UgcUploadPublishBlockBanner from '../../avatarItem/components/UgcUploadPublishBlockBanner';
import Unification2D3DBanner from '../../avatarItem/components/Unification2D3DBanner';
import { isOnItemTab } from '../../avatarItem/utils/avatarMenuMapUtils';
import {
  ALL_ASSET_TYPES_L1_KEY,
  AVATAR_ITEMS_ACTIVE_TAB,
  buildTaxonomyActiveTab,
  isAllAssetTypesActiveTab,
  isAvatarLooksActiveTab,
  isRecentsActiveTab,
  isTaxonomyActiveTab,
  shouldOpenTaxonomyView,
  TAXONOMY_HOST_ASSET,
} from '../../avatarItem/utils/taxonomyRoutingUtils';
import useCreationsFilters from '../../common/hooks/useCreationsFilters';
import { isDevelopmentItemAsset } from '../../contentManager/developmentItems/developmentItemsInventoryUtils';
import { isPrimitiveAssetType } from '../../developerItem/primitives/types';
import menuItems from '../../menu/constants/MenuConstants';
import CreationsIANavigationControls from '../../menu/containers/CreationsIANavigationControls';
import creationsMenuManager from '../../menu/implementations/CreationsMenuManager';
import type MenuState from '../../menu/interfaces/MenuState';
import MomentsCreationsPanel from '../../moments/components/MomentsCreationsPanel';
import useMomentsGate from '../../moments/hooks/useMomentsGate';
import useShowcasesGate from '../../showcase/hooks/useShowcasesGate';
import type { VerificationMetadataContextValue } from '../../verification/hooks/VerificationMetadataContext';
import useCreationsStyles from '../components/Creations.styles';
import useAvatarLooksGate from '../hooks/useAvatarLooksGate';
import useTaxonomyDashboardGate from '../hooks/useTaxonomyDashboardGate';
import useTextDocumentGate from '../hooks/useTextDocumentGate';
import useUGCFoldersGate from '../hooks/useUGCFoldersGate';

const AvatarItemsGridContainer = dynamic(
  () => import('../../avatarItem/containers/AvatarItemsGridContainer'),
  { ssr: false },
);
const AnimationListContainer = dynamic(
  () => import('../../developerItem/animations/list/AnimationListContainer'),
  { ssr: false },
);
const DecalGridContainer = dynamic(
  () => import('../../developerItem/decals/list/DecalGridContainer'),
  { ssr: false },
);
const MediaListContainer = dynamic(
  () => import('../../developerItem/media/list/MediaListContainer'),
  { ssr: false },
);
const MeshPartGridContainer = dynamic(
  () => import('../../developerItem/meshParts/list/MeshPartGridContainer'),
  { ssr: false },
);
const ModelGridContainer = dynamic(
  () => import('../../developerItem/models/list/ModelGridContainer'),
  { ssr: false },
);
const PluginGridContainer = dynamic(
  () => import('../../developerItem/plugins/list/PluginGridContainer'),
  { ssr: false },
);
const ShowcasesPanel = dynamic(() => import('../../showcase/containers/ShowcasesPanel'), {
  ssr: false,
});
const PrimitiveGridContainer = dynamic(
  () => import('../../developerItem/primitives/list/PrimitiveGridContainer'),
  { ssr: false },
);
const ShareLinkContainer = dynamic(
  () => import('@modules/share-links/components/ShareLinkContainer'),
  { ssr: false },
);
const CreationsGridContainer = dynamic(() => import('./CreationsGridContainer'), { ssr: false });
const DevelopmentItemsInventory = dynamic(
  () => import('../../contentManager/developmentItems/DevelopmentItemsInventory'),
  { ssr: false },
);
const UniversalAccessRequestsView = dynamic(
  () => import('../../assetAccessRequests/components/UniversalAccessRequestsView'),
  { ssr: false },
);

export interface CreationsContainerProps {
  verificationMetadata: VerificationMetadataContextValue | undefined;
  currentGroup: TGroup | null;
  currentUser: TUser | null;
  allowedAssetTypes: Set<Asset> | undefined;
}

function parseActiveTabQueryParam(value: string | string[] | undefined | null): Asset {
  const raw = readQueryValue(value);
  if (raw === undefined) {
    return Asset.MyExperiences;
  }
  if (isValidEnumValue(Asset, raw)) {
    return raw;
  }
  return Asset.MyExperiences;
}

const CreationsContainer: FunctionComponent<React.PropsWithChildren<CreationsContainerProps>> = ({
  verificationMetadata,
  currentGroup,
  currentUser,
  allowedAssetTypes,
}) => {
  const [query, setQueryParams] = useQueryParams(['activeTab', 'filterIndex']);
  const { resetAllFilters } = useCreationsFilters();
  const { settings } = useSettings();
  const isMomentsTabEnabled = useMomentsGate();
  const isTextDocumentEnabled = useTextDocumentGate();
  const isUGCFoldersEnabled = useUGCFoldersGate();
  const isAvatarLooksEnabled = useAvatarLooksGate();
  const isShowcasesEnabled = useShowcasesGate();
  const { translate } = useTranslation();
  const isTaxonomyEnabled = useTaxonomyDashboardGate();
  const previousAssetTypeRef = useRef<Asset | undefined>(undefined);

  const filteredTypes = useMemo(() => {
    const filteredResult: Asset[] = [];
    if (process.env.buildTarget === 'luobu') {
      filteredResult.push(Asset.TShirt, Asset.Shirt, Asset.Pants);
    }

    return filteredResult;
  }, []);

  // Deliberately independent of the taxonomy setting: settings load asynchronously, and while they
  // are pending this must still recognise a taxonomy activeTab. Otherwise the menu treats it as an
  // unknown tab and rewrites the URL, discarding the selected category.
  const isTaxonomyTab = isTaxonomyActiveTab(query.activeTab);
  // Recents carries no asset type in either view, so it resolves through the host tab like a
  // taxonomy tab does. Without this its item-type form parses as an unknown tab and the menu
  // rewrites the URL back to My Experiences.
  const isHostedTab = isTaxonomyTab || isRecentsActiveTab(query.activeTab);

  const menuState = useMemo(() => {
    // A taxonomy activeTab carries no asset type, so it resolves through the Avatar Items host tab
    // — except All Asset Types, which keeps its own folder-backed tab while staying in the taxonomy
    // namespace so the category chips remain on screen.
    const taxonomyAsset = isAllAssetTypesActiveTab(query.activeTab)
      ? Asset.AllCatalogAsset
      : TAXONOMY_HOST_ASSET;
    return creationsMenuManager.getMenuState(
      isHostedTab ? taxonomyAsset : parseActiveTabQueryParam(query.activeTab),
      filteredTypes,
    );
  }, [query.activeTab, filteredTypes, isHostedTab]);

  // Recents no longer has its own tab — it is the first option of the All tab's folder dropdown.
  // Migrate any legacy `?activeTab=Recents` deep link to the All tab at filterIndex 0 (preserving the
  // view) so it resolves to Recents there. Left as-is, the stale tab renders through the host asset
  // type and would highlight and lock an item-type chip; the redirect also routes it through normal
  // tab validation, so Recents is not reachable when the folders flag is off.
  useEffect(() => {
    if (isRecentsActiveTab(query.activeTab)) {
      setQueryParams({
        activeTab: isTaxonomyTab
          ? buildTaxonomyActiveTab(ALL_ASSET_TYPES_L1_KEY)
          : Asset.AllCatalogAsset,
        filterIndex: 0,
      });
    }
  }, [query.activeTab, isTaxonomyTab, setQueryParams]);

  const filteredMenuItems = useMemo(
    () => menuItems.filter((item) => !filteredTypes.includes(item.type)),
    [filteredTypes],
  );

  const {
    classes: { section, container },
  } = useCreationsStyles();

  const onMenuStateChange = useCallback(
    (state: MenuState) => {
      if (menuState.menuItem === state.menuItem && menuState.submenuItem === state.submenuItem) {
        // No update if the menu states are equivalent
        return;
      }
      if (
        shouldOpenTaxonomyView({
          isTaxonomyEnabled,
          isChangingSection: menuState.menuItem !== state.menuItem,
          nextAssetType: creationsMenuManager.getAssetType(state),
        })
      ) {
        setQueryParams({ activeTab: AVATAR_ITEMS_ACTIVE_TAB, filterIndex: 0 });
        return;
      }
      const usedIndex = isOnItemTab(state.menuItem.type) ? 0 : undefined;
      setQueryParams({
        activeTab: creationsMenuManager.getAssetType(state),
        filterIndex: usedIndex,
      });
    },
    [menuState.menuItem, menuState.submenuItem, setQueryParams, isTaxonomyEnabled],
  );

  const validatedMenuState = useMemo(() => {
    const activeTab = parseActiveTabQueryParam(query.activeTab);

    // Hold the current state while a tab's gate is still resolving, so a deep link
    // into that tab is not redirected away before we know whether it is allowed.
    const isGateResolvingForActiveTab =
      (isMomentsTabEnabled === undefined && activeTab === Asset.Moments) ||
      (isUGCFoldersEnabled === undefined && activeTab === Asset.AllCatalogAsset) ||
      (isAvatarLooksEnabled === undefined && activeTab === Asset.AvatarLooks) ||
      (isShowcasesEnabled === undefined && activeTab === Asset.Showcase);

    if (isGateResolvingForActiveTab) {
      return menuState;
    }

    const isOnTextDocumentTab = parseActiveTabQueryParam(query.activeTab) === Asset.TextDocument;
    if (isTextDocumentEnabled === undefined && isOnTextDocumentTab) {
      return menuState;
    }

    /* getValidMenuState returns the current menu state if it is valid,
       and the next closest menu state if it is not */
    const validMenuState = creationsMenuManager.getValidMenuState(
      filteredMenuItems,
      menuState,
      settings,
      currentGroup,
      undefined,
      undefined,
      isMomentsTabEnabled,
      isUGCFoldersEnabled,
      isAvatarLooksEnabled,
      isShowcasesEnabled,
      isTextDocumentEnabled,
    );

    if (validMenuState !== menuState) {
      // Keep the taxonomy activeTab intact; it intentionally carries no asset type.
      if (!isTaxonomyTab) {
        const usedIndex = isOnItemTab(validMenuState.menuItem.type) ? 0 : undefined;
        setQueryParams({
          activeTab: creationsMenuManager.getAssetType(validMenuState),
          filterIndex: usedIndex,
        });
      }
      return validMenuState;
    }
    return menuState;
  }, [
    filteredMenuItems,
    menuState,
    isTaxonomyTab,
    query.activeTab,
    settings,
    currentGroup,
    isMomentsTabEnabled,
    isTextDocumentEnabled,
    isUGCFoldersEnabled,
    isAvatarLooksEnabled,
    isShowcasesEnabled,
    setQueryParams,
  ]);

  const assetType = useMemo(() => {
    return creationsMenuManager.getAssetType(validatedMenuState);
  }, [validatedMenuState]);

  useEffect(() => {
    if (previousAssetTypeRef.current === undefined) {
      previousAssetTypeRef.current = assetType;
      return;
    }

    const previousAssetType = previousAssetTypeRef.current;
    if (previousAssetType !== assetType) {
      previousAssetTypeRef.current = assetType;
      // Both sides need the TextDocument gate. Without it the helper reads TextDocument as "not a
      // development item", so moving between it and another development item tab looked like
      // leaving the consolidated flow and cleared the shared Archived filter.
      const isConsolidatedDevelopmentItemChange =
        isDevelopmentItemAsset(previousAssetType, isTextDocumentEnabled) &&
        isDevelopmentItemAsset(assetType, isTextDocumentEnabled);
      if (!isConsolidatedDevelopmentItemChange) {
        resetAllFilters();
      }
    }
  }, [assetType, isTextDocumentEnabled, resetAllFilters]);

  const shouldRenderGrowthBannerOnTab =
    assetType === Asset.MyExperiences || assetType === Asset.SharedExperiences;

  const isMarketplaceAssetType = useMemo(() => {
    return allowedAssetTypes?.has(assetType);
  }, [assetType, allowedAssetTypes]);
  // These banners are about uploading and publishing marketplace items. The category view has no
  // asset type of its own and borrows the Avatar Items host tab, which is a marketplace type — so
  // without this they would also appear over Avatars, where the item-type tab hides them.
  const showMarketplaceItemBanners =
    isMarketplaceAssetType && !isAvatarLooksActiveTab(query.activeTab);
  const showDevelopmentItemsInventory = isDevelopmentItemAsset(assetType, isTextDocumentEnabled);

  const assetsGridContainer = useMemo(() => {
    if (showDevelopmentItemsInventory) {
      return (
        <DevelopmentItemsInventory
          groupId={currentGroup?.id}
          useTabNavigationSpacing={false}
          userId={currentUser?.id}
        />
      );
    }
    if (assetType === Asset.Decal) {
      return <DecalGridContainer groupId={currentGroup?.id} />;
    }
    if (assetType === Asset.Animation) {
      return <AnimationListContainer groupId={currentGroup?.id} />;
    }
    if (assetType === Asset.Audio || assetType === Asset.Video) {
      return <MediaListContainer mediaAssetType={assetType} groupId={currentGroup?.id} />;
    }
    if (assetType === Asset.Plugin) {
      return <PluginGridContainer groupId={currentGroup?.id} />;
    }
    if (assetType === Asset.Model) {
      return <ModelGridContainer groupId={currentGroup?.id} />;
    }
    if (assetType === Asset.MeshPart) {
      return <MeshPartGridContainer groupId={currentGroup?.id} />;
    }
    // Text documents are served by the consolidated branch above once the gate resolves true, and
    // with it resolved false the menu validation redirects to an enabled tab. The only way here is
    // a deep link while the gate is still resolving, so wait rather than render another surface.
    if (assetType === Asset.TextDocument) {
      return (
        <div className='flex justify-center items-center padding-y-xxlarge'>
          <ProgressCircle
            ariaLabel={translate('Label.Loading')}
            size='Large'
            variant='Indeterminate'
          />
        </div>
      );
    }
    if (assetType === Asset.ShareLink) {
      return <ShareLinkContainer />;
    }
    if (assetType === Asset.Moments) {
      return <MomentsCreationsPanel />;
    }
    if (assetType === Asset.AssetPermissionRequests) {
      return <UniversalAccessRequestsView />;
    }
    if (assetType === Asset.Showcase) {
      return <ShowcasesPanel groupId={currentGroup?.id} />;
    }
    if (
      assetType === Asset.AllCatalogAsset ||
      assetType === Asset.AvatarLooks ||
      assetType === Asset.AvatarBackground
    ) {
      return <AvatarItemsGridContainer assetType={assetType} groupId={currentGroup?.id} />;
    }
    if (isPrimitiveAssetType(assetType)) {
      return <PrimitiveGridContainer primitiveAssetType={assetType} groupId={currentGroup?.id} />;
    }

    if (isMarketplaceAssetType) {
      return <AvatarItemsGridContainer assetType={assetType} groupId={currentGroup?.id} />;
    }

    return (
      <CreationsGridContainer
        assetType={assetType}
        creatorType={currentGroup?.id ? SearchCreatorType.Group : SearchCreatorType.User}
        creatorTargetId={currentGroup?.id ?? currentUser?.id ?? 0}
      />
    );
  }, [
    assetType,
    currentGroup?.id,
    currentUser?.id,
    isMarketplaceAssetType,
    showDevelopmentItemsInventory,
    translate,
  ]);

  return (
    <ToolboxServiceApiRoot>
      <HubMeta
        title={buildTitle(
          validatedMenuState.submenuItem
            ? translate(validatedMenuState.submenuItem.nameKey)
            : translate(validatedMenuState.menuItem.nameKey),
        )}
        breadcrumb={buildBreadcrumb(
          translate('Heading.Creations'),
          translate(validatedMenuState.menuItem.nameKey),
          validatedMenuState.submenuItem
            ? translate(validatedMenuState.submenuItem.nameKey)
            : undefined,
        )}
      />
      <section className={section}>
        <Grid container direction='column' className={container}>
          <AgeVerificationUpsellBanner trackingPage={AgeVerificationUpsellPage.Creations} />
          {!showDevelopmentItemsInventory && (
            <CreationsIANavigationControls
              menuState={validatedMenuState}
              onMenuStateChange={onMenuStateChange}
              verificationMetadata={verificationMetadata}
              group={currentGroup}
            />
          )}
          {shouldRenderGrowthBannerOnTab && <AudienceReachGrowthOpportunitiesBanner />}
          {showMarketplaceItemBanners && <Unification2D3DBanner />}
          {showMarketplaceItemBanners && <UgcUploadPublishBlockBanner />}
          {assetsGridContainer}
        </Grid>
      </section>
    </ToolboxServiceApiRoot>
  );
};

export default withTranslation(CreationsContainer, [
  TranslationNamespace.AssetTypes,
  TranslationNamespace.Controls,
  TranslationNamespace.Creations,
  TranslationNamespace.Error,
  TranslationNamespace.Navigation,
  TranslationNamespace.ShareLinksManagement,
  TranslationNamespace.ExperienceReleases,
  // Taxonomy category names are translated from their canonical names, so the chip row and the
  // sub-selector need this namespace loaded.
  TranslationNamespace.Taxonomy,
]);
