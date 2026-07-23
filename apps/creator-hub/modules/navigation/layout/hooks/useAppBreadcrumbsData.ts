import {
  useCurrentItem,
  useCurrentPlace,
  useCurrentEvent,
  useCurrentDeveloperItem,
  useCurrentExperienceSubscription,
  useCurrentEnvironment,
  useCurrentExperimentForAppBreadcrumbs,
  useCurrentLook,
  useCurrentAlert,
} from '@modules/creations';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useCurrentBadge } from '@modules/creations/badge';
import { useCurrentDeveloperProduct } from '@modules/creations/developerProduct';
import { useCurrentPass } from '@modules/creations/pass';
import { Item } from '@modules/miscellaneous/common';
import Creator from '@modules/miscellaneous/common/enums/Creator';
import { HostType } from '@rbx/clients/virtualEventsApi';
import { useTranslation } from '@rbx/intl';
import { useRouter } from 'next/router';
import { ReactNode, useCallback, useMemo } from 'react';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import useQuestionnaireV2Gate from '@modules/experience-questionnaire/hooks/useQuestionnaireV2Gate';
import { useSettings } from '@modules/settings';
import {
  BreadcrumbItemDetails,
  getDisplayNameParams,
  getLinkPathParams,
  RouterParseItemToBreadcrumbItemDetails,
} from '../constants/BreadcrumbsItemConstants';
import BreadcrumbItemType from '../enums/BreadcrumbsItemType';

type ParentBreadcrumbLevelInfo = {
  item: BreadcrumbItemDetails;
  pathname: string;
  sidebarName: ReactNode;
  SidebarComponent: React.ElementType;
};

export default function useAppBreadcrumbsData() {
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
  const { environment } = useCurrentEnvironment();
  const { alert } = useCurrentAlert();
  const { experiment } = useCurrentExperimentForAppBreadcrumbs();

  const {
    params: { enableIAM2 },
  } = useIXPParameters(IXPLayers.CreatorHubNavigationUser);
  const { shouldUseV2: enableQuestionnaireV2 } = useQuestionnaireV2Gate();
  const { settings } = useSettings();
  const {
    query: { id, badgeId, notificationCategory, activeTab },
    pathname,
  } = useRouter();

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
    return experienceSubscriptionDetails?.id;
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
      [BreadcrumbItemType.Environments]: (() => {
        if (!pathname.includes('/environments/') || pathname.endsWith('/environments')) {
          return translate('Heading.Environments');
        }
        if (pathname.includes('/new_environment')) {
          return translate('Action.CreateEnvironment');
        }
        return environment?.slug ?? undefined;
      })(),
      [BreadcrumbItemType.Alerts]: alert?.name,
      [BreadcrumbItemType.ExperimentDetails]: experiment?.name ?? undefined,
      [BreadcrumbItemType.Look]: 'test look', // TODO @mryumae/@vchandramouli: Update this once the LookDetail BE is updated with new fields
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
    experiment?.name,
    pathname,
    environment?.slug,
    alert?.name,
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
    if (pathname.includes(BreadcrumbItemType.AssociatedItems) && activeTab) {
      return activeTab as Item;
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
    switch (currentItemType) {
      case Item.Bundle:
        return {
          currentItemGroupId: getMarketplaceItemGroupId ?? groupId,
          isCurrentItemLoading: isLoadingItem,
        };
      case Item.DeveloperProduct:
      case Item.LibraryAsset:
        return {
          currentItemGroupId:
            developerItemDetails?.creator?.type === Creator.Group
              ? developerItemDetails?.creator?.id
              : groupId,
          isCurrentItemLoading: isLoadingDeveloperItem,
        };
      case Item.CatalogAsset:
        return {
          currentItemGroupId: getMarketplaceItemGroupId ?? groupId,
          isCurrentItemLoading: isLoadingItem,
        };
      case Item.Event:
        return {
          currentItemGroupId:
            eventDetails?.host?.hostType === HostType.Group ? eventDetails?.host?.hostId : groupId,
          isCurrentItemLoading: isLoadingEvent,
        };
      case Item.Look:
        return {
          currentItemGroupId:
            lookDetail?.curator?.type === Creator.Group
              ? (lookDetail?.curator?.id as number)
              : groupId,
          isCurrentItemLoading: isLoadingLook,
        };

      default:
        return { currentItemGroupId: groupId, isCurrentItemLoading: isLoadingGame };
    }
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

  const displayNameParam: getDisplayNameParams = useMemo(() => {
    return {
      translate,
      itemType: currentItemType,
      enableIAM2: Boolean(enableIAM2),
      enableQuestionnaireV2,
      enableCoreContentStatusLabelLink: settings.enableCoreContentStatusLabelLink,
    };
  }, [
    currentItemType,
    enableIAM2,
    enableQuestionnaireV2,
    settings.enableCoreContentStatusLabelLink,
    translate,
  ]);

  const pathLinkParams: getLinkPathParams = useMemo(() => {
    return {
      baseId: id as string,
      badgeId: badgeId as string,
      passId,
      groupId:
        groupId?.toString() ?? (currentItemGroupId ? currentItemGroupId.toString() : undefined),
      assetId,
      bundleId,
      developerItemId: developerItemDetails?.id,
      associatedItemType: currentItemType,
      experienceSubscriptionId: experienceSubscriptionId ?? undefined,
      environmentId: environment?.id ?? undefined,
      experimentId: experiment?.id?.toString() ?? undefined,
      lookId: lookId ?? undefined,
    };
  }, [
    id,
    badgeId,
    passId,
    groupId,
    currentItemGroupId,
    assetId,
    bundleId,
    developerItemDetails?.id,
    currentItemType,
    experienceSubscriptionId,
    environment?.id,
    experiment?.id,
    lookId,
  ]);

  const getParentBreadcrumbLevelInfo = useCallback(
    (pathnameValue: string): ParentBreadcrumbLevelInfo[] => {
      const path = pathnameValue.split('/');
      const levels: ParentBreadcrumbLevelInfo[] = path
        .reduce((contentList, item, currentIndex) => {
          const currentItem: BreadcrumbItemDetails = RouterParseItemToBreadcrumbItemDetails[item];
          const hasID = (path[currentIndex + 1] || '').startsWith('[');
          if (
            !currentItem ||
            !currentItem.SidebarComponentAsParent ||
            currentIndex === path.length - 1
          ) {
            return contentList;
          }
          // ignore withId level if no [id] specified
          if (currentItem.withId && !hasID) {
            return contentList;
          }

          const parentItem = currentItem.parentItemTypeName
            ? RouterParseItemToBreadcrumbItemDetails[currentItem.parentItemTypeName]
            : null;

          const link = parentItem
            ? parentItem.getLinkPath?.(pathLinkParams)
            : currentItem.getLinkPath?.(pathLinkParams);
          const sidebarName = currentItem.getSidebarName?.(displayNameParam);

          return [
            ...contentList,
            {
              item: currentItem,
              pathname: link ?? '',
              sidebarName: sidebarName ?? translate('Action.Back'),
              SidebarComponent: currentItem.SidebarComponentAsParent,
            },
          ];
        }, [] as ParentBreadcrumbLevelInfo[])
        .reverse(); // from lower level to higher level

      return levels;
    },
    [displayNameParam, pathLinkParams, translate],
  );
  const parentBreadcrumbLevels = useMemo(() => {
    return getParentBreadcrumbLevelInfo(pathname);
  }, [getParentBreadcrumbLevelInfo, pathname]);

  return {
    itemNameMapping,
    pathLinkParams,
    displayNameParam,
    currentItemType,
    currentItemGroupId,
    parentBreadcrumbLevels,
    isCurrentItemLoading,
  };
}
