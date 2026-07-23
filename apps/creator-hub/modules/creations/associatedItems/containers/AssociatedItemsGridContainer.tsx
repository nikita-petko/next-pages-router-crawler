import { Fragment, useCallback, useMemo, useState } from 'react';
import { useSettings } from '@modules/settings';
import badgesApi, { BadgeSortByEnum, BadgeGetLimitEnum } from '@modules/clients/badges';
import { PageResponse, SortOrder } from '@rbx/core';
import { useTranslation } from '@rbx/intl';
import {
  Item,
  itemTypeToCreatePath,
  itemTypeToLearnMoreUrl,
  itemTypeToNameKeys,
  itemTypeToReorderPath,
} from '@modules/miscellaneous/common';
import { Button, Grid, Link } from '@rbx/ui';
import { useRouter } from 'next/router';
import { catalogClient, experienceSubscriptionsClient } from '@modules/clients';
import marketplaceSalesApi from '@modules/clients/marketplacesales';
import { UniverseProductConfiguration } from '@rbx/clients/marketplaceSalesApi/v1';
import { RobloxCatalogApiCatalogSearchDetailedResponseItem } from '@rbx/clients/catalogApi';
import { EmptyStateIllustrationKey } from '@modules/miscellaneous/common/components';
import ExperienceSubscriptionUnauthorizedView from '../../experienceSubscriptions/components/ExperienceSubscriptionUnauthorizedView';
import UniverseProductConfigurationStatus from '../../common/enums/UniverseProductConfigurationStatus';
import { useExperienceSubscriptionPermission } from '../../experienceSubscriptions';
import { AssociatedItemsGridPagingParameters } from '../../common/interfaces/AssociatedItemsGridPagingParameters';
import { creationsMenuManager } from '../../menu';
import {
  CreationData,
  ItemCardContainer,
  ItemGridContainer,
  ItemGridEmptyView,
  useCreationsCustomSettings,
} from '../../common';
import useAssociatedItemsGridContainerStyles from './AssociatedItemsGridContainer.styles';
import AssociatedItemsSearchContainer from './AssociatedItemsSearchContainer';

export interface AssociatedItemsGridContainerProps {
  universeId: number;
  itemType: Exclude<Item, Item.DeveloperProduct | Item.GamePass>;
}

const getItemPrice = (price?: number): number | null => {
  if (typeof price !== 'undefined' && price > 0) {
    return price;
  }
  return null; // Offsale
};

const getIllustrationForItemType = (type: Item): EmptyStateIllustrationKey | undefined => {
  return type === Item.Badge ? 'badge' : undefined;
};

const AssociatedItemsGridContainer = ({
  universeId,
  itemType,
}: AssociatedItemsGridContainerProps) => {
  // TODO: Add sorting
  const sortOrder = SortOrder.Desc;
  const { translate, translateHTML } = useTranslation();
  const router = useRouter();
  const {
    classes: { actionButton },
  } = useAssociatedItemsGridContainerStyles();
  const [hasData, setHasData] = useState(false);
  const hasSubscriptionPermissions = useExperienceSubscriptionPermission(
    (router.query.id ?? 0) as number,
  );
  const { isUniverseEnrolledInBadgesReordering } = useCreationsCustomSettings();
  const { settings } = useSettings();

  const loadAssociatedItems = useCallback(
    async (
      parameters: AssociatedItemsGridPagingParameters,
    ): Promise<PageResponse<CreationData>> => {
      const associatedItemsParameters = parameters;
      if (associatedItemsParameters.itemType === Item.Badge) {
        // Badges
        const { nextPageCursor, data: badgesData } = await badgesApi.getBadges(
          associatedItemsParameters.universeId,
          associatedItemsParameters.sortOrder,
          associatedItemsParameters.count as BadgeGetLimitEnum,
          associatedItemsParameters.cursor,
          BadgeSortByEnum.DateCreated,
        );

        const formattedData =
          badgesData?.map((badge) => ({
            itemType: associatedItemsParameters.itemType,
            assetId: badge.id,
            name: badge.name,
            isActive: badge.enabled,
            isClickable: true,
          })) || [];
        return {
          nextPageCursor,
          items: formattedData,
        };
      }

      if (associatedItemsParameters.itemType === Item.CatalogAsset) {
        // Marketplace items
        const { nextPageCursor, data: universeProductConfigurationData } =
          await marketplaceSalesApi.listUniverseProductConfigurations(
            associatedItemsParameters.universeId,
            UniverseProductConfigurationStatus.Enabled,
            associatedItemsParameters.count,
            associatedItemsParameters.cursor,
          );

        if (!universeProductConfigurationData || universeProductConfigurationData.length === 0) {
          return {
            nextPageCursor: nextPageCursor ?? undefined,
            items: [],
          };
        }

        // Currently only Assets are supported.
        const { data: assetDetailsData } = await catalogClient.postAssetDetails(
          universeProductConfigurationData
            .filter((configuration) => configuration.targetType === 'Asset')
            .map((configuration) => configuration.targetId ?? 0),
        );
        const universeProductConfigurationDict: {
          [targetId: number]: UniverseProductConfiguration;
        } = Object.fromEntries(
          universeProductConfigurationData
            .filter((configuration) => !!configuration.targetId)
            .map((data) => [data.targetId, data]),
        );

        const formattedData =
          assetDetailsData?.map(
            (assetDetail: RobloxCatalogApiCatalogSearchDetailedResponseItem) => ({
              itemType: associatedItemsParameters.itemType,
              collectibleItemId:
                universeProductConfigurationDict[assetDetail.id ?? 0].collectibleItemId ??
                undefined,
              collectibleProductId:
                universeProductConfigurationDict[assetDetail.id ?? 0].collectibleProductId ??
                undefined,
              assetId: assetDetail.id,
              name: assetDetail.name,
              price: getItemPrice(assetDetail.price),
              universeProductConfigEnabled:
                universeProductConfigurationDict[assetDetail.id ?? 0].status ===
                UniverseProductConfigurationStatus.Enabled,
              creatorName: assetDetail.creatorName,
              isLimited2: true,
              isClickable: false,
            }),
          ) || [];
        return {
          nextPageCursor: nextPageCursor ?? undefined,
          items: formattedData ?? [],
        };
      }

      if (
        associatedItemsParameters.itemType === Item.ExperienceSubscription &&
        hasSubscriptionPermissions
      ) {
        // Subscriptions
        const { nextCursor, developerSubscriptions, hasMoreResults } =
          await experienceSubscriptionsClient.getExperienceSubscriptions(
            associatedItemsParameters.universeId,
            associatedItemsParameters.cursor,
            associatedItemsParameters.loadPageSize,
          );

        // Get USD prices to use for display
        const { priceTierPrices } = await experienceSubscriptionsClient.getPriceInfo(
          associatedItemsParameters.universeId,
        );

        const subscriptionPriceMap = priceTierPrices ?? {};

        const formattedData =
          developerSubscriptions?.map((developerSubscription) => ({
            itemType: associatedItemsParameters.itemType,
            subscriptionProductId: `EXP-${developerSubscription.id}`,
            name: developerSubscription.name ?? '',
            productStatus: developerSubscription.productStatusType,
            subscriptionPrice: subscriptionPriceMap[developerSubscription.basePriceId ?? ''],
            assetId: developerSubscription.imageAssetId ?? 0,
            universeId: developerSubscription.universeId,
            creationTimestamp: developerSubscription.createdTimestampMs,
            isClickable: true,
          })) || [];

        // sort
        // descending by product status (active (2) before inactive (1)) then ascending by creation date
        if (formattedData.length > 0) {
          formattedData.sort((sub1, sub2) => {
            if ((sub1.productStatus ?? 0) > (sub2.productStatus ?? 0)) {
              return -1;
            }

            if ((sub1.productStatus ?? 0) < (sub2.productStatus ?? 0)) {
              return 1;
            }

            return (sub1.creationTimestamp ?? 0) - (sub2.creationTimestamp ?? 0);
          });
        }

        return {
          nextPageCursor: hasMoreResults ? (nextCursor ?? undefined) : undefined,
          items: formattedData ?? [],
        };
      }

      return {
        nextPageCursor: undefined,
        items: [],
      };
    },
    [hasSubscriptionPermissions],
  );

  const pagingParameters = useMemo(() => {
    return { itemType, universeId, sortOrder };
  }, [itemType, sortOrder, universeId]);

  const handleCreateButtonClick = useCallback(() => {
    router.push(`/dashboard/creations/experiences/${universeId}/${itemTypeToCreatePath[itemType]}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Do not depend on router
  }, [itemType, universeId]);

  const handleReorderButtonClick = useCallback(() => {
    router.push(
      `/dashboard/creations/experiences/${universeId}/${itemTypeToReorderPath[itemType]}`,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Do not depend on router
  }, [itemType, universeId]);

  const searchEnabled = useMemo(() => {
    return itemType === Item.CatalogAsset;
  }, [itemType]);

  const createItemButton = useMemo(() => {
    if (itemTypeToCreatePath[itemType]) {
      return (
        <Button
          data-testid='createAssociatedItemsButton'
          variant='contained'
          size='large'
          onClick={handleCreateButtonClick}>
          {translate('Button.CreateNewItem', {
            itemType: translate(itemTypeToNameKeys[itemType]),
          })}
        </Button>
      );
    }
    return undefined;
  }, [translate, itemType, handleCreateButtonClick]);

  const reorderItemsButton = useMemo(() => {
    if (
      itemType === Item.Badge &&
      settings.enableBadgeReordering &&
      isUniverseEnrolledInBadgesReordering
    ) {
      return (
        <Button
          data-testid='reorderAssociatedItemsButton'
          variant='contained'
          color='secondary'
          size='large'
          onClick={handleReorderButtonClick}>
          {translate('Button.Reorder')}
        </Button>
      );
    }
    return undefined;
  }, [
    itemType,
    handleReorderButtonClick,
    translate,
    isUniverseEnrolledInBadgesReordering,
    settings,
  ]);

  const emptyStateGridDescription = useMemo(() => {
    const messageKey =
      itemType !== Item.ExperienceSubscription
        ? 'Message.EmptyMessagesWithLink'
        : 'Message.SubscriptionEmptyMessagesWithLink';

    return translateHTML(
      messageKey,
      [
        {
          opening: 'LinkStart',
          closing: 'LinkEnd',
          content(chunks) {
            return (
              <Link href={itemTypeToLearnMoreUrl[itemType]} target='_blank'>
                {chunks}
              </Link>
            );
          },
        },
      ],
      {
        itemType: translate(creationsMenuManager.getItemFullNameKey(itemType)),
      },
    );
  }, [itemType, translate, translateHTML]);

  const emptyStateGrid = useMemo(() => {
    return (
      <ItemGridEmptyView
        createItemButton={createItemButton}
        emptyMessage={translate('Message.EmptyMessage', {
          itemType: translate(creationsMenuManager.getItemFullNameKey(itemType)),
        })}
        itemDescription={emptyStateGridDescription}
        illustration={getIllustrationForItemType(itemType)}
      />
    );
  }, [createItemButton, translate, itemType, emptyStateGridDescription]);

  const onLoad = useCallback((data: CreationData[]) => {
    setHasData(data.length > 0);
  }, []);

  if (!hasSubscriptionPermissions && itemType === Item.ExperienceSubscription) {
    return <ExperienceSubscriptionUnauthorizedView showButton={false} />;
  }

  return (
    <Fragment>
      {hasData && (
        <Grid container spacing={2}>
          <Grid item className={actionButton}>
            {createItemButton}
          </Grid>
          <Grid item className={actionButton}>
            {reorderItemsButton}
          </Grid>
        </Grid>
      )}
      {searchEnabled && (
        <AssociatedItemsSearchContainer
          universeId={universeId}
          hasData={hasData}
          pagingParameters={pagingParameters}
          loadAssociatedItems={loadAssociatedItems}
          onLoad={onLoad}
          itemType={itemType}
        />
      )}
      {!searchEnabled && (
        <ItemGridContainer
          pagingParameters={pagingParameters}
          loadItems={loadAssociatedItems}
          getItemKey={(item) => item.assetId ?? 0}
          GridItemComponent={ItemCardContainer}
          errorMessage={translate('Message.LoadItemsError', {
            itemType: translate(creationsMenuManager.getItemFullNameKey(itemType)),
          })}
          onLoad={onLoad}
          emptyMessage={emptyStateGrid}
        />
      )}
    </Fragment>
  );
};

export default AssociatedItemsGridContainer;
