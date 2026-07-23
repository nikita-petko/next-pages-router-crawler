import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { SearchCreatorType } from '@rbx/client-universes-api/v1';
import { buildBreadcrumb, buildTitle, HubMeta } from '@rbx/creator-hub-history';
import { useFlag } from '@rbx/flags';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid } from '@rbx/ui';
import { enableAvatarLooks } from '@generated/flags/avatarMarketplace';
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
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import ToolboxServiceApiRoot from '@modules/toolboxService/ToolboxServiceApiProvider';
import Unification2D3DBanner from '../../avatarItem/components/Unification2D3DBanner';
import { isOnItemTab } from '../../avatarItem/utils/avatarMenuMapUtils';
import useCreationsFilters from '../../common/hooks/useCreationsFilters';
import useEnableCreationsNavLayout from '../../common/hooks/useEnableCreationsNavLayout';
import { isPrimitiveAssetType } from '../../developerItem/primitives/types';
import menuItems from '../../menu/constants/MenuConstants';
import CreationsIANavigationControls from '../../menu/containers/CreationsIANavigationControls';
import CreationsMenuContainer from '../../menu/containers/CreationsMenuContainer';
import creationsMenuManager from '../../menu/implementations/CreationsMenuManager';
import type MenuState from '../../menu/interfaces/MenuState';
import type { VerificationMetadataContextValue } from '../../verification/hooks/VerificationMetadataContext';
import useCreationsStyles from '../components/Creations.styles';
import MomentsCreationsPanel from '../components/MomentsCreationsPanel';
import useMomentsGate from '../hooks/useMomentsGate';
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
const PrimitiveGridContainer = dynamic(
  () => import('../../developerItem/primitives/list/PrimitiveGridContainer'),
  { ssr: false },
);
const ShareLinkContainer = dynamic(
  () => import('@modules/share-links/components/ShareLinkContainer'),
  { ssr: false },
);
const CreationsGridContainer = dynamic(() => import('./CreationsGridContainer'), { ssr: false });
const UniversalAccessRequestsView = dynamic(
  () => import('@modules/creations/assetAccessRequests/components/UniversalAccessRequestsView'),
  { ssr: false },
);

export interface CreationsContainerProps {
  verificationMetadata: VerificationMetadataContextValue | undefined;
  currentGroup: TGroup | null;
  currentUser: TUser | null;
  allowedAssetTypes: Set<Asset> | undefined;
}

function parseActiveTabQueryParam(value: string | string[] | undefined | null): Asset {
  const raw = value == null ? undefined : Array.isArray(value) ? value[0] : value;
  if (typeof raw !== 'string') {
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
  const isUGCFoldersEnabled = useUGCFoldersGate();
  const { ready: avatarLooksReady, value: isAvatarLooksEnabled } = useFlag(enableAvatarLooks);
  const { translate } = useTranslation();
  const enableCreationsNavLayout = useEnableCreationsNavLayout();
  const previousAssetTypeRef = useRef<Asset | undefined>(undefined);

  const filteredTypes = useMemo(() => {
    const filteredResult: Asset[] = [];
    if (process.env.buildTarget === 'luobu') {
      filteredResult.push(Asset.TShirt, Asset.Shirt, Asset.Pants);
    }

    return filteredResult;
  }, []);

  const menuState = useMemo(() => {
    return creationsMenuManager.getMenuState(
      parseActiveTabQueryParam(query.activeTab),
      filteredTypes,
    );
  }, [query.activeTab, filteredTypes]);

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
      const usedIndex = isOnItemTab(state.menuItem.type) ? 0 : undefined;
      setQueryParams({
        activeTab: creationsMenuManager.getAssetType(state),
        filterIndex: usedIndex,
      });
    },
    [menuState.menuItem, menuState.submenuItem, setQueryParams],
  );

  const validatedMenuState = useMemo(() => {
    const isOnMomentsTab = parseActiveTabQueryParam(query.activeTab) === Asset.Moments;
    if (isMomentsTabEnabled === undefined && isOnMomentsTab) {
      return menuState;
    }

    const isOnAllCatalogTab = parseActiveTabQueryParam(query.activeTab) === Asset.AllCatalogAsset;
    if (isUGCFoldersEnabled === undefined && isOnAllCatalogTab) {
      return menuState;
    }

    const isOnAvatarLooksTab = parseActiveTabQueryParam(query.activeTab) === Asset.AvatarLooks;
    if (!avatarLooksReady && isOnAvatarLooksTab) {
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
    );

    if (validMenuState !== menuState) {
      const usedIndex = isOnItemTab(validMenuState.menuItem.type) ? 0 : undefined;
      setQueryParams({
        activeTab: creationsMenuManager.getAssetType(validMenuState),
        filterIndex: usedIndex,
      });
      return validMenuState;
    }
    return menuState;
  }, [
    filteredMenuItems,
    menuState,
    query.activeTab,
    settings,
    currentGroup,
    isMomentsTabEnabled,
    isUGCFoldersEnabled,
    isAvatarLooksEnabled,
    avatarLooksReady,
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

    if (previousAssetTypeRef.current !== assetType) {
      previousAssetTypeRef.current = assetType;
      resetAllFilters();
    }
  }, [assetType, resetAllFilters]);

  const shouldRenderGrowthBannerOnTab =
    assetType === Asset.MyExperiences || assetType === Asset.SharedExperiences;

  const isMarketplaceAssetType = useMemo(() => {
    return allowedAssetTypes?.has(assetType);
  }, [assetType, allowedAssetTypes]);

  const assetsGridContainer = useMemo(() => {
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
    if (assetType === Asset.ShareLink) {
      return <ShareLinkContainer />;
    }
    if (assetType === Asset.Moments) {
      return <MomentsCreationsPanel />;
    }
    if (assetType === Asset.AssetPermissionRequests) {
      return <UniversalAccessRequestsView />;
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
  }, [assetType, currentGroup?.id, currentUser?.id, isMarketplaceAssetType]);

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
          {enableCreationsNavLayout ? (
            <CreationsIANavigationControls
              menuState={validatedMenuState}
              onMenuStateChange={onMenuStateChange}
              verificationMetadata={verificationMetadata}
              group={currentGroup}
            />
          ) : (
            <CreationsMenuContainer
              menuItems={filteredMenuItems}
              menuState={validatedMenuState}
              onMenuStateChange={onMenuStateChange}
              verificationMetadata={verificationMetadata}
              group={currentGroup}
              isMarketplaceAssetType={isMarketplaceAssetType}
            />
          )}
          {shouldRenderGrowthBannerOnTab && <AudienceReachGrowthOpportunitiesBanner />}
          {isMarketplaceAssetType && <Unification2D3DBanner />}
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
]);
