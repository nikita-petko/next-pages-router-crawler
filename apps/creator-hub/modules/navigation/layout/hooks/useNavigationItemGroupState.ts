import { useMemo } from 'react';
import { useRouter } from 'next/router';
import { HostType } from '@rbx/client-virtual-events-api/v1';
import { useTranslation } from '@rbx/intl';
import useCurrentBadge from '@modules/creations/badge/hooks/useCurrentBadge';
import { useCurrentDeveloperItem } from '@modules/creations/developerItem/common/DeveloperItemProvider';
import { useCurrentDeveloperProduct } from '@modules/creations/developerProduct/contexts/DeveloperProductContext';
import useCurrentEvent from '@modules/creations/event/hooks/useCurrentEvent';
import useCurrentExperienceSubscription from '@modules/creations/experienceSubscriptions/hooks/useCurrentExperienceSubscription';
import useCurrentItem from '@modules/creations/itemConfiguration/hooks/useCurrentItem';
import useCurrentLook from '@modules/creations/look/hooks/useCurrentLook';
import { useCurrentPass } from '@modules/creations/pass/contexts/PassContext';
import useCurrentPlace from '@modules/creations/places/hooks/useCurrentPlace';
import { Item } from '@modules/miscellaneous/common';
import Creator from '@modules/miscellaneous/common/enums/Creator';
import { isItem } from '@modules/miscellaneous/common/enums/Item';
import queryToString from '@modules/miscellaneous/utils/queryToString';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useBreadcrumbItemNames } from '../contexts/BreadcrumbItemNameContext';
import BreadcrumbItemType from '../enums/BreadcrumbsItemType';

export default function useNavigationItemGroupState() {
  const { translate } = useTranslation();
  const { gameDetails, isLoadingGame } = useCurrentGame();
  const { isLoadingItem, marketplaceItemDetails } = useCurrentItem();
  const { badgeDetails } = useCurrentBadge();
  const { developerProductDetails } = useCurrentDeveloperProduct();
  const { passDetails } = useCurrentPass();
  const { lookDetail, isLoadingLook } = useCurrentLook();
  const { placeDetails } = useCurrentPlace();
  const { eventDetails, isLoading: isLoadingEvent } = useCurrentEvent();
  const { developerItemDetails, isLoadingDeveloperItem } = useCurrentDeveloperItem();
  const { experienceSubscriptionDetails } = useCurrentExperienceSubscription();
  const registeredNames = useBreadcrumbItemNames();

  const { query, pathname } = useRouter();
  const { id, badgeId, notificationCategory, activeTab, experimentId, environmentId } =
    queryToString(query);

  const groupId = useMemo(() => {
    return gameDetails?.creator?.type === 'Group' ? gameDetails?.creator?.id : undefined;
  }, [gameDetails]);

  const assetId = useMemo(() => {
    if (marketplaceItemDetails?.item?.marketplaceItemDetails?.assetDetails) {
      return marketplaceItemDetails?.item?.id?.toString();
    }
    return undefined;
  }, [marketplaceItemDetails]);

  const passId = useMemo(() => {
    return passDetails?.gamePassId?.toString();
  }, [passDetails]);

  const bundleId = useMemo(() => {
    if (marketplaceItemDetails?.item?.marketplaceItemDetails?.bundleDetails) {
      return marketplaceItemDetails?.item?.id?.toString();
    }
    return undefined;
  }, [marketplaceItemDetails]);

  const experienceSubscriptionId = useMemo(() => {
    return experienceSubscriptionDetails?.id ?? undefined;
  }, [experienceSubscriptionDetails]);

  const getMarketplaceItemGroupId = useMemo(() => {
    if (marketplaceItemDetails?.item?.creator?.kindCase === 2) {
      return marketplaceItemDetails?.item?.creator?.group?.groupId;
    }
    return groupId;
  }, [
    groupId,
    marketplaceItemDetails?.item?.creator?.group?.groupId,
    marketplaceItemDetails?.item?.creator?.kindCase,
  ]);

  const lookId = useMemo(() => {
    return lookDetail?.lookId;
  }, [lookDetail]);

  const itemNameMapping: { [key in BreadcrumbItemType]?: string | undefined } = useMemo(() => {
    return {
      [BreadcrumbItemType.Bundle]: marketplaceItemDetails?.item?.name,
      [BreadcrumbItemType.Games]: gameDetails?.name,
      [BreadcrumbItemType.Badge]: badgeDetails?.name,
      [BreadcrumbItemType.DeveloperProduct]: developerProductDetails?.name ?? undefined,
      [BreadcrumbItemType.GamePass]: passDetails?.name ?? undefined,
      [BreadcrumbItemType.Catalog]: marketplaceItemDetails?.item?.name,
      [BreadcrumbItemType.Places]: placeDetails?.name,
      [BreadcrumbItemType.Event]: eventDetails?.title ?? undefined,
      [BreadcrumbItemType.CreatorStore]: developerItemDetails?.name,
      [BreadcrumbItemType.Category]: notificationCategory
        ? translate(`Label.Category${notificationCategory}`)
        : undefined,
      [BreadcrumbItemType.ExperienceSubscription]: experienceSubscriptionDetails?.name ?? undefined,

      [BreadcrumbItemType.Look]: lookDetail?.name ?? undefined,
      ...registeredNames,
    };
  }, [
    marketplaceItemDetails?.item?.name,
    gameDetails?.name,
    badgeDetails?.name,
    developerProductDetails?.name,
    passDetails?.name,
    placeDetails?.name,
    eventDetails?.title,
    developerItemDetails?.name,
    notificationCategory,
    translate,
    experienceSubscriptionDetails?.name,
    lookDetail?.name,
    registeredNames,
  ]);

  const currentItemType = useMemo(() => {
    if (pathname.includes(BreadcrumbItemType.ExperienceSubscription)) {
      return Item.ExperienceSubscription;
    }
    if (pathname.includes(BreadcrumbItemType.Badge)) {
      return Item.Badge;
    }
    if (pathname.includes(BreadcrumbItemType.ReferralRewards)) {
      return Item.ReferralRewards;
    }
    if (pathname.includes(BreadcrumbItemType.Bundle)) {
      return Item.Bundle;
    }
    if (pathname.includes(BreadcrumbItemType.GamePass)) {
      return Item.GamePass;
    }
    if (pathname.includes(BreadcrumbItemType.DeveloperProduct)) {
      return Item.DeveloperProduct;
    }
    if (pathname.includes(BreadcrumbItemType.Catalog)) {
      return Item.CatalogAsset;
    }
    if (pathname.includes(BreadcrumbItemType.CreatorStore)) {
      return Item.LibraryAsset;
    }
    if (pathname.includes(BreadcrumbItemType.Places)) {
      return Item.Places;
    }
    if (pathname.includes(BreadcrumbItemType.Environments)) {
      return Item.Environment;
    }
    if (pathname.includes(BreadcrumbItemType.Alerts)) {
      return Item.Alert;
    }
    if (pathname.includes(BreadcrumbItemType.Event)) {
      return Item.Event;
    }
    if (pathname.includes(BreadcrumbItemType.Notifications)) {
      return Item.Notifications;
    }
    if (
      pathname.includes(BreadcrumbItemType.AssociatedItems) &&
      typeof activeTab === 'string' &&
      isItem(activeTab)
    ) {
      return activeTab;
    }
    // Avatar Creation Tokens needs to be checked before experiences.
    if (pathname.includes(BreadcrumbItemType.AvatarCreationTokens)) {
      return Item.AvatarCreationToken;
    }
    if (pathname.includes(BreadcrumbItemType.Experiences)) {
      return Item.Game;
    }
    if (pathname.includes(BreadcrumbItemType.Advanced)) {
      return Item.Advanced;
    }
    if (pathname.includes(BreadcrumbItemType.Look)) {
      return Item.Look;
    }

    return undefined;
  }, [activeTab, pathname]);

  const {
    currentItemGroupId,
    isCurrentItemLoading,
  }: { currentItemGroupId: number | undefined; isCurrentItemLoading: boolean } = useMemo(() => {
    if (currentItemType === Item.Bundle || currentItemType === Item.CatalogAsset) {
      return {
        currentItemGroupId: getMarketplaceItemGroupId ?? groupId,
        isCurrentItemLoading: isLoadingItem,
      };
    }

    if (currentItemType === Item.DeveloperProduct || currentItemType === Item.LibraryAsset) {
      return {
        currentItemGroupId:
          developerItemDetails?.creator?.type === Creator.Group
            ? developerItemDetails?.creator?.id
            : groupId,
        isCurrentItemLoading: isLoadingDeveloperItem,
      };
    }

    if (currentItemType === Item.Event) {
      return {
        currentItemGroupId:
          eventDetails?.host?.hostType === HostType.Group ? eventDetails?.host?.hostId : groupId,
        isCurrentItemLoading: isLoadingEvent,
      };
    }

    if (currentItemType === Item.Look) {
      return {
        currentItemGroupId:
          lookDetail?.curator?.type === Creator.Group ? lookDetail?.curator?.id : groupId,
        isCurrentItemLoading: isLoadingLook,
      };
    }

    return { currentItemGroupId: groupId, isCurrentItemLoading: isLoadingGame };
  }, [
    currentItemType,
    getMarketplaceItemGroupId,
    groupId,
    isLoadingItem,
    developerItemDetails?.creator?.type,
    developerItemDetails?.creator?.id,
    isLoadingDeveloperItem,
    eventDetails?.host?.hostType,
    eventDetails?.host?.hostId,
    isLoadingEvent,
    isLoadingGame,
    lookDetail?.curator?.type,
    lookDetail?.curator?.id,
    isLoadingLook,
  ]);

  return {
    itemNameMapping,
    currentItemType,
    currentItemGroupId,
    isCurrentItemLoading,
    pathname,
    id,
    badgeId,
    passId,
    groupId,
    assetId,
    bundleId,
    experienceSubscriptionId,
    getMarketplaceItemGroupId,
    lookId,
    developerItemDetails,
    experimentId,
    environmentId,
  };
}
