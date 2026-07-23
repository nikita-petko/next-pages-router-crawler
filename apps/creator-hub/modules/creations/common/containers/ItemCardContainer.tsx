import { useRouter } from 'next/router';
import type { FunctionComponent } from 'react';
import React, { useMemo, useState, useCallback, Fragment, useRef, useEffect } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Tooltip, MoreHorizIcon, EditOutlinedIcon, IconButton } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import { CreatorEligibility } from '@modules/clients/experienceGuidelinesService';
import gamejoinClient from '@modules/clients/gamejoin';
import AgeRestrictedDialog from '@modules/experience-guidelines/components/AgeRestrictedDialog';
import useCreatorEligibility, {
  CONTENT_RESTRICTED,
} from '@modules/experience-guidelines/hooks/useCreatorEligibility';
import type { Asset } from '@modules/miscellaneous/common';
import { Item as ItemType, itemTypeToPath, Item } from '@modules/miscellaneous/common';
import { Link } from '@modules/miscellaneous/components';
import useStudio, { EStudioTaskType } from '@modules/miscellaneous/hooks/useStudio';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { getUrlForItemType } from '@modules/miscellaneous/urls';
import {
  dynamicAvatarItemsAssetTypes,
  dynamicAvatarItemsBundleTypes,
  getAllowedMarketplaceItemTypes,
} from '../../menu/constants/MenuConstants';
import getBundleTypeToBundleTypeString from '../../unifiedFeeSystem/helper/unifiedFeeSystemBundleMapping';
import {
  getConfigurePageUrl,
  getIsDurableType,
  getPublishPageUrl,
} from '../../unifiedFeeSystem/helper/UnifiedFeeSystemHelper';
import ItemCard from '../components/ItemCard';
import ItemCardContextMenu from '../components/ItemCardContextMenu';
import type CreationData from '../interfaces/CreationData';
import type { ItemDetails } from '../interfaces/ItemDetails';
import useItemCardContainerStyles from './ItemCardContainer.styles';

export type ItemCardContainerProps = ItemDetails<CreationData>;
const ItemCardContainer: FunctionComponent<React.PropsWithChildren<ItemCardContainerProps>> = ({
  item,
  removeItem,
  updateItem,
  isLoading,
  toggleEnableItem,
}) => {
  const {
    classes: { moreButtonContainer, moreIconButton, itemCardContainer, hidden, menuOpenedButton },
    cx,
  } = useItemCardContainerStyles();
  const router = useRouter();
  const { translate } = useTranslation();
  const { creatorEligibility, getCreatorEligibility, setCreatorEligibility } =
    useCreatorEligibility(item.ageRecommendation?.contentMaturity);
  const [isHoverOnItemCard, setIsHoverOnItemCard] = useState<boolean>(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const { isCompatible, open, dialog } = useStudio();
  const [isMarketplaceAssetType, setIsMarketplaceAssetType] = useState<boolean>(false);

  const { user } = useAuthentication();

  const {
    classes: { link },
  } = useItemCardContainerStyles();

  useEffect(() => {
    const setFromDynamicSets = () => {
      if (item.itemType === Item.Bundle && item.bundleType !== undefined) {
        const bundleEnum = getBundleTypeToBundleTypeString(String(item.bundleType));
        setIsMarketplaceAssetType(dynamicAvatarItemsBundleTypes.has(bundleEnum));
      } else {
        setIsMarketplaceAssetType(dynamicAvatarItemsAssetTypes.has(item.assetType as Asset));
      }
    };

    if (dynamicAvatarItemsAssetTypes.size === 0 && dynamicAvatarItemsBundleTypes.size === 0) {
      getAllowedMarketplaceItemTypes().then(() => {
        setFromDynamicSets();
      });
    } else {
      setFromDynamicSets();
    }
  }, [item.assetType, item.bundleType, item.itemType]);

  const baseUrl =
    (typeof window !== 'undefined' && window.location?.origin) || process.env.baseUrl || '';

  const getUrlByItemTypeAndSettings = useCallback(
    (itemType: ItemType, universeId: number, assetId: number) => {
      if (itemType === ItemType.Game) {
        const path = `/dashboard/creations/experiences/${universeId}/overview`;
        return new URL(path, baseUrl).href;
      }
      if (itemType === ItemType.Badge) {
        const { id } = router.query;
        const path = `/dashboard/creations/experiences/${id}/badges/${assetId}/overview`;
        return new URL(path, baseUrl).href;
      }

      if (itemType === ItemType.AvatarCreationToken) {
        const path = `/dashboard/creations/experiences/${universeId}/avatar-creation-tokens/${assetId}/configure`;
        return new URL(path, baseUrl).href;
      }
      return getUrlForItemType(itemType, assetId);
    },
    [router.query, baseUrl],
  );
  const url = useMemo(() => {
    if (!isLoading) {
      let id = item.assetId;
      if (item.itemType === Item.Bundle) {
        id = item.bundleId;
      } else if (item.itemType === Item.Look) {
        id = item.lookId;
      }
      return getUrlByItemTypeAndSettings(item.itemType, item.universeId ?? 0, (id as number) ?? 0);
    }
    return null;
  }, [isLoading, item, getUrlByItemTypeAndSettings]);

  const itemPageLink = useMemo(() => {
    // The link should be the marketplace page if the user is not the creator
    const isCreatorOrGroupLook =
      item.itemType === Item.Look ? item.isClickable : user?.id === item.userId;
    if ((!item.isClickable || !isCreatorOrGroupLook) && url && window) {
      return url;
    }
    // grab game/universe id from url path
    const { id } = router.query;
    const itemTypePathSegment = itemTypeToPath[item.itemType];

    if (item.itemType === ItemType.AvatarCreationToken) {
      return `/dashboard/creations/experiences/${id}/${itemTypePathSegment}/${item.assetId}/configure`;
    }
    if (item.itemType === ItemType.Game) {
      return `/dashboard/creations/${itemTypePathSegment}/${
        item.universeId ?? item.assetId
      }/overview`;
    }
    if (item.itemType === ItemType.Badge) {
      // badges are a part of the ItemType.Game url path
      return `/dashboard/creations/${itemTypeToPath[ItemType.Game]}/${id}/${itemTypePathSegment}/${
        item.assetId
      }/overview`;
    }
    if (item.itemType === ItemType.TranslatorGame) {
      return `/dashboard/creations/${itemTypePathSegment}/${item.universeId}/localization/translation?activeTab=strings`;
    }
    if (item.itemType === ItemType.DeveloperProduct) {
      return `/dashboard/creations/${itemTypeToPath[ItemType.Game]}/${id}/${itemTypePathSegment}/${
        item.productId
      }/configure`;
    }
    if (item.itemType === ItemType.GamePass) {
      return `/dashboard/creations/${itemTypeToPath[ItemType.Game]}/${id}/${itemTypePathSegment}/${
        item.assetId
      }/configure`;
    }

    const isCatalogAsset = item.assetType && isMarketplaceAssetType;
    if (isCatalogAsset || item.itemType === ItemType.Bundle || item.itemType === ItemType.Look) {
      let itemId = item.assetId;
      let itemType = ItemType.CatalogAsset;
      if (item.itemType === ItemType.Bundle) {
        itemId = item.bundleId;
        itemType = ItemType.Bundle;
      } else if (item.itemType === ItemType.Look) {
        itemId = item.lookId;
        itemType = ItemType.Look;
        return getConfigurePageUrl(itemType, itemId); // There is no publish page for looks
      }

      return item.isCollectible
        ? getConfigurePageUrl(itemType, itemId)
        : getPublishPageUrl(itemType, itemId);
    }
    if (item.itemType === ItemType.Places || item.itemType === ItemType.CreatedPlaces) {
      return `/dashboard/creations/${itemTypeToPath[ItemType.Game]}/${id}/${itemTypePathSegment}/${
        item.placeId
      }/configure`;
    }
    if (item.itemType === ItemType.ExperienceSubscription) {
      return `/dashboard/creations/${itemTypeToPath[ItemType.Game]}/${id}/${itemTypePathSegment}/${
        item.subscriptionProductId
      }/configure`;
    }

    return '';
  }, [item, router, url, isMarketplaceAssetType, user?.id]);

  const handleClose = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const updateItemPrivacy = useCallback(
    (isActive: boolean) => {
      updateItem({ ...item, isActive });
    },
    [item, updateItem],
  );

  // For 17+ games, disable context menu until we can confirm the creator is eligible (e.g. is age verified)
  useEffect(() => {
    if (item.ageRecommendation?.contentMaturity === CONTENT_RESTRICTED) {
      getCreatorEligibility(item.universeId, user);
    }
  }, [user, getCreatorEligibility, item, setCreatorEligibility]);

  const itemCardContent = useMemo(() => {
    if (item.isClickable) {
      if (creatorEligibility === CreatorEligibility.Eligible) {
        return (
          <Link classes={{ root: link }} href={itemPageLink}>
            <ItemCard
              item={item}
              isLoading={isLoading}
              isMarketplaceAssetType={isMarketplaceAssetType}
            />
          </Link>
        );
      }

      return (
        <AgeRestrictedDialog creatorEligibility={creatorEligibility}>
          <ItemCard
            item={item}
            isLoading={isLoading}
            isMarketplaceAssetType={isMarketplaceAssetType}
          />
        </AgeRestrictedDialog>
      );
    }
    return (
      <ItemCard item={item} isLoading={isLoading} isMarketplaceAssetType={isMarketplaceAssetType} />
    );
  }, [item, isLoading, creatorEligibility, link, itemPageLink, isMarketplaceAssetType]);

  // Variant is allowed if the item type is durable, non-limited, and has been published before
  const isVariantAllowed =
    getIsDurableType(item.assetType, item.bundleType) && !item.isLimited2 && item.isCollectible;

  return (
    <div
      className={itemCardContainer}
      onMouseEnter={() => setIsHoverOnItemCard(true)}
      onMouseLeave={() => setIsHoverOnItemCard(false)}>
      {itemCardContent}
      {!isLoading && (
        <>
          <div className={cx({ [hidden]: !isHoverOnItemCard }, moreButtonContainer)}>
            {isCompatible &&
              (item.itemType === ItemType.Game || item.itemType === ItemType.Places) && (
                <Tooltip title={translate('Action.EditInStudio')} arrow>
                  <IconButton
                    data-testid='edit-experience-button'
                    onClick={() => {
                      // Pre-launch the Team Create RCC server so it is ready by the time Studio finishes starting
                      if (item.assetId !== undefined) {
                        gamejoinClient.teamCreatePreemptive(Number(item.assetId));
                      }
                      // NOTE (jcountryman, 09/09/22): assetIds and placeIds are
                      // the references to placeIds in Game and Place item type respectively
                      open({
                        task: EStudioTaskType.EditPlace,
                        universeId: item.universeId?.toString() || '',
                        placeId: item.assetId?.toString() || item.placeId?.toString() || '',
                      });
                    }}
                    aria-label={translate('Action.EditInStudio')}
                    color='onMediaDark'
                    className={moreIconButton}
                    size='small'>
                    <EditOutlinedIcon color='action' />
                  </IconButton>
                </Tooltip>
              )}

            {item.itemType !== ItemType.TranslatorGame && (
              <IconButton
                tabIndex={0}
                data-testid='experience-options-button'
                aria-label={translate('label.MoreOptions')}
                color='onMediaDark'
                className={cx({ [menuOpenedButton]: isMenuOpen }, moreIconButton)}
                size='small'
                onClick={() => setIsMenuOpen(true)}
                ref={buttonRef}>
                <MoreHorizIcon color='action' />
              </IconButton>
            )}
          </div>

          <ItemCardContextMenu
            itemType={item.itemType}
            creation={item}
            removeItem={removeItem}
            updateItemPrivacy={updateItemPrivacy}
            updateItem={updateItem}
            url={url ?? undefined}
            handleClose={handleClose}
            anchorEl={buttonRef.current}
            menuOpen={isMenuOpen}
            creatorIsEligibleForGuidelines={creatorEligibility === CreatorEligibility.Eligible}
            toggleEnableItem={toggleEnableItem}
            isMarketplaceAssetType={isMarketplaceAssetType}
            isVariantAllowed={isVariantAllowed}
          />
          {dialog}
        </>
      )}
    </div>
  );
};

export default withTranslation(ItemCardContainer, [
  TranslationNamespace.Creations,
  TranslationNamespace.ServerManagement,
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.ExperienceReleases,
]);
