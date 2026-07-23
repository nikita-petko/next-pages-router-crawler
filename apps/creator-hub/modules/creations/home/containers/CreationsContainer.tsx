import React, { FunctionComponent, useCallback, useMemo } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import type { TGroup, TUser } from '@modules/authentication/types';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { Asset } from '@modules/miscellaneous/common';
import { Grid } from '@rbx/ui';
import { useSettings } from '@modules/settings';
import { SearchCreatorType } from '@rbx/clients/universesApi';
import ToolboxServiceApiProvider from '@modules/toolboxService/ToolboxServiceApiProvider';
import ShareLinkContainer from '@modules/share-links/components/ShareLinkContainer';
import {
  AgeVerificationUpsellBanner,
  AgeVerificationUpsellPage,
} from '@modules/age-verification-upsell/components/AgeVerificationUpsellBanner';
import { buildBreadcrumb, buildTitle, HubMeta } from '@rbx/creator-hub-history';
import DecalGridContainer from '../../developerItem/decals/list/DecalGridContainer';
import AnimationListContainer from '../../developerItem/animations/list/AnimationListContainer';
import MeshPartGridContainer from '../../developerItem/meshParts/list/MeshPartGridContainer';
import MediaListContainer from '../../developerItem/media/list/MediaListContainer';
import PluginGridContainer from '../../developerItem/plugins/list/PluginGridContainer';
import ModelGridContainer from '../../developerItem/models/list/ModelGridContainer';
import { useCreationsFilters } from '../../common';
import { isOnItemTab, AvatarItemsGridContainer } from '../../avatarItem';
import PrimitiveGridContainer from '../../developerItem/primitives/list/PrimitiveGridContainer';
import { isPrimitiveAssetType } from '../../developerItem/primitives/types';
import { VerificationMetadataContextValue } from '../../verification';
import { CreationsMenuContainer, creationsMenuManager, menuItems, MenuState } from '../../menu';
import useCreationsStyles from '../components/Creations.styles';
import CreationsGridContainer from './CreationsGridContainer';

export interface CreationsContainerProps {
  verificationMetadata: VerificationMetadataContextValue | undefined;
  currentGroup: TGroup | null;
  currentUser: TUser | null;
  allowedAssetTypes: Set<Asset> | undefined;
}

type TMenuQueryParam = Asset | undefined;

const CreationsContainer: FunctionComponent<React.PropsWithChildren<CreationsContainerProps>> = ({
  verificationMetadata,
  currentGroup,
  currentUser,
  allowedAssetTypes,
}) => {
  const [query, setQueryParams] = useQueryParams(['activeTab', 'filterIndex']);
  const { resetAllFilters } = useCreationsFilters();
  const { settings } = useSettings();
  const { translate } = useTranslation();

  const filteredTypes = useMemo(() => {
    const filteredResult: Asset[] = [];
    if (process.env.buildTarget === 'luobu') {
      filteredResult.push(Asset.TShirt, Asset.Shirt, Asset.Pants);
    }

    return filteredResult;
  }, []);

  const menuState = useMemo(() => {
    return creationsMenuManager.getMenuState(
      (query.activeTab as TMenuQueryParam) ?? Asset.MyExperiences,
      filteredTypes,
    );
  }, [query.activeTab, filteredTypes]);

  const filteredMenuItems = useMemo(
    () => menuItems.filter((item) => filteredTypes.indexOf(item.type) === -1),
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
      resetAllFilters();
      const usedIndex = isOnItemTab(state.menuItem.type) ? 0 : undefined;
      setQueryParams({
        activeTab: creationsMenuManager.getAssetType(state),
        filterIndex: usedIndex,
      });
    },
    [menuState.menuItem, menuState.submenuItem, resetAllFilters, setQueryParams],
  );

  const validatedMenuState = useMemo(() => {
    /* getValidMenuState returns the current menu state if it is valid,
       and the next closest menu state if it is not */
    const validMenuState = creationsMenuManager.getValidMenuState(
      filteredMenuItems,
      menuState,
      settings,
      currentGroup,
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
  }, [filteredMenuItems, menuState, settings, currentGroup, setQueryParams]);

  const assetType = useMemo(() => {
    return creationsMenuManager.getAssetType(validatedMenuState);
  }, [validatedMenuState]);

  const isMarketplaceAssetType = useMemo(() => {
    return allowedAssetTypes?.has(assetType);
  }, [assetType, allowedAssetTypes]);

  const assetsGridContainer = useMemo(() => {
    switch (assetType) {
      case Asset.Decal:
        return <DecalGridContainer groupId={currentGroup?.id} />;
      case Asset.Animation:
        return <AnimationListContainer groupId={currentGroup?.id} />;
      case Asset.Audio:
      case Asset.Video:
        return <MediaListContainer mediaAssetType={assetType} groupId={currentGroup?.id} />;
      case Asset.Plugin:
        return <PluginGridContainer groupId={currentGroup?.id} />;
      case Asset.Model:
        return <ModelGridContainer groupId={currentGroup?.id} />;
      case Asset.MeshPart:
        return <MeshPartGridContainer groupId={currentGroup?.id} />;
      case Asset.ShareLink:
        return <ShareLinkContainer />;
      case Asset.AllCatalogAsset:
        return <AvatarItemsGridContainer assetType={assetType} groupId={currentGroup?.id} />;
      default:
        if (isPrimitiveAssetType(assetType)) {
          return (
            <PrimitiveGridContainer primitiveAssetType={assetType} groupId={currentGroup?.id} />
          );
        }

        if (isMarketplaceAssetType) {
          return <AvatarItemsGridContainer assetType={assetType} groupId={currentGroup?.id} />;
        }

        return (
          <CreationsGridContainer
            assetType={assetType}
            creatorType={currentGroup?.id ? SearchCreatorType.Group : SearchCreatorType.User}
            creatorTargetId={currentGroup?.id || currentUser?.id || 0}
          />
        );
    }
  }, [assetType, currentGroup?.id, currentUser?.id, isMarketplaceAssetType]);

  return (
    <ToolboxServiceApiProvider>
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
          <CreationsMenuContainer
            menuItems={filteredMenuItems}
            menuState={validatedMenuState}
            onMenuStateChange={onMenuStateChange}
            verificationMetadata={verificationMetadata}
            group={currentGroup}
            isMarketplaceAssetType={isMarketplaceAssetType}
          />
          {assetsGridContainer}
        </Grid>
      </section>
    </ToolboxServiceApiProvider>
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
