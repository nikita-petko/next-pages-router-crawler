import type { FunctionComponent } from 'react';
import React, { useMemo, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from '@rbx/intl';
import type { ReturnPolicy } from '@rbx/thumbnails';
import { Grid, Typography } from '@rbx/ui';
import {
  CreatorHubCreationsPermissionParameters,
  IXPLayers,
} from '@modules/clients/ixpExperiments';
import {
  Item as ItemType,
  itemTypeToThumbnailType,
  itemTypeToReturnPolicyType,
} from '@modules/miscellaneous/common';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import AvatarCreationCardCreatorName from '../../avatarCreationTokens/components/AvatarCreationCardCreatorName';
import AvatarCreationTokenItemCardThumbnail from '../../avatarCreationTokens/components/CustomTokenPickerMenuItem/AvatarCreationTokenItemCardThumbnail';
import TeamCreatePresenceIndicator from '../../collaborativeTools/components/TeamCreatePresenceIndicator';
import ItemCardExperienceSubscriptionsId from '../../experienceSubscriptions/components/ItemCard/ItemCardExperienceSubscriptionsId';
import ItemCardDeveloperSubscriptionsProductStatus from '../../experienceSubscriptions/components/ItemCard/ItemCardExperienceSubscriptionsProductStatus';
import LookItemCardDescription from '../../look/components/LookItemCardDescription';
import LookItemCardPrice from '../../look/components/LookItemCardPrice';
import { translateBundleInfoTypeToBundleType } from '../../unifiedFeeSystem/helper/UnifiedFeeSystemHelper';
import useEnabledIecItemTypes from '../hooks/useEnabledIecItemTypes';
import type CreationData from '../interfaces/CreationData';
import useItemCardStyles from './ItemCard.styles';
import ItemCardActiveSubscribers from './ItemCardActiveSubscribers';
import ItemCardActivity from './ItemCardActivity';
import ItemCardAgeRestrictedCollaboration from './ItemCardAgeRestrictedCollaboration';
import ItemCardCoreContentStatus from './ItemCardCoreContentStatus';
import ItemCardCreatedDate from './ItemCardCreatedDate';
import ItemCardCreatorName from './ItemCardCreatorName';
import ItemCardFiatPrice from './ItemCardFiatPrice';
import ItemCardItemId from './ItemCardItemId';
import ItemCardLimitedChip from './ItemCardLimitedChip';
import ItemCardModerationStatus from './ItemCardModerationStatus';
import ItemCardPrice from './ItemCardPrice';
import ItemCardScheduledSale from './ItemCardScheduledSale';
import ItemCardStartPlace from './ItemCardStartPlace';
import ItemCardTitle from './ItemCardTitle';
import ItemThumbnail from './ItemThumbnail';

export interface ItemCardProps {
  item: CreationData;
  isLoading: boolean;
  isMarketplaceAssetType?: boolean;
}

const ItemCard: FunctionComponent<React.PropsWithChildren<ItemCardProps>> = ({
  item,
  isLoading,
  isMarketplaceAssetType,
}) => {
  const {
    classes: { itemCardContainer, itemCardImg, itemCardInfoContainer, thumbnailContainer },
  } = useItemCardStyles();

  const { translate } = useTranslation();
  const router = useRouter();
  const { enabledItemTypesMetadata } = useEnabledIecItemTypes();
  const {
    params: {
      [CreatorHubCreationsPermissionParameters.EnableNewBadgePattern]: enableNewBadgePattern,
      [CreatorHubCreationsPermissionParameters.EnableAtRiskAnnotationOnExperiences]:
        enableAtRiskAnnotation,
      enableAudiencesReplacement,
    },
    isFetched: isCreationsPermissionIxpFetched,
  } = useIXPParameters(IXPLayers.CreatorHubCreationsPermission);
  const showNewBadgePattern = isCreationsPermissionIxpFetched && enableNewBadgePattern === true;
  const shouldRenderStatusBadge =
    item.itemType === ItemType.Game &&
    (enableAudiencesReplacement === true
      ? typeof item.audiences !== 'undefined'
      : typeof item.isActive !== 'undefined');
  const getItemTypeDisplayName = useMemo(() => {
    const enabledItemType =
      item.assetType ??
      (item.bundleType !== undefined
        ? translateBundleInfoTypeToBundleType(item.bundleType)
        : undefined);

    return enabledItemType === undefined || enabledItemTypesMetadata[enabledItemType] === undefined
      ? ''
      : enabledItemTypesMetadata[enabledItemType].displayName;
  }, [item.assetType, item.bundleType, enabledItemTypesMetadata]);

  const thumbnailType = useMemo(() => {
    return itemTypeToThumbnailType[item.itemType];
  }, [item]);

  const returnPolicy: ReturnPolicy = useMemo(() => {
    return itemTypeToReturnPolicyType[item.itemType];
  }, [item.itemType]);

  const thumbnailTargetId = useMemo(() => {
    if (item.itemType === ItemType.Places || item.itemType === ItemType.CreatedPlaces) {
      return item.placeId ?? 0;
    }
    if (item.itemType === ItemType.Bundle) {
      return item.bundleId ?? 0;
    }
    if (item.itemType === ItemType.ExperienceSubscription) {
      return item.assetId ?? 0;
    }
    if (item.itemType === ItemType.Look) {
      return item.lookId ?? 0;
    }

    return item.universeId ?? item.assetId ?? 0;
  }, [item]);

  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const showTeamCreatePresenceIndicator =
    item.itemType === ItemType.Game && item.activeUsers && item.activeUsers.length > 0;

  const isOnLookPage = useMemo(() => {
    return router.pathname?.includes('/look/') ?? false;
  }, [router.pathname]);

  useEffect(() => {
    const gridContainer = containerRef.current;
    if (!gridContainer || !showTeamCreatePresenceIndicator) {
      return undefined;
    }
    const containerResizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const { width } = entry.target.getBoundingClientRect();
        setContainerWidth(width);
      });
    });
    containerResizeObserver.observe(gridContainer);
    return () => {
      containerResizeObserver.unobserve(gridContainer);
    };
  }, [showTeamCreatePresenceIndicator]);

  const itemCardDescription = (
    <div className={itemCardInfoContainer}>
      {shouldRenderStatusBadge && (
        <ItemCardCoreContentStatus
          universeId={item.universeId ?? 0}
          contentMaturity={item.ageRecommendation?.contentMaturity}
          isActive={item.isActive ?? false}
          isLoading={isLoading}
          releaseStatus={item.releaseStatus}
          isFriendsOnly={item.isFriendsOnly}
          audiences={item.audiences}
          creatorType={item.creatorType}
          coreContentEligibility={item.coreContentEligibility}
          enableAtRiskAnnotation={enableAtRiskAnnotation === true}
          useNewBadgePattern={showNewBadgePattern}
          ageRecommendation={item.ageRecommendation?.minimumAge ?? null}
          isSequestered={item.isSequestered}
          isDiscoveryBlocked={item.isDiscoveryBlocked}
        />
      )}

      {/* Spacer between status pill and title — kept separate from the badge
          margin so it doesn't push the Radix tooltip further from the pill */}
      {shouldRenderStatusBadge && <div style={{ height: 8 }} />}

      {typeof item.name !== 'undefined' && <ItemCardTitle name={item.name} isLoading={isLoading} />}

      {item.itemType === ItemType.Game && item.isAgeRestrictedCollaboration && (
        <Typography>
          <ItemCardAgeRestrictedCollaboration isLoading={isLoading} universeId={item.universeId} />
        </Typography>
      )}

      {(item.bundleId != null ||
        item.lookId != null ||
        (item.assetType != null && isMarketplaceAssetType)) &&
        typeof item.created !== 'undefined' && (
          <ItemCardCreatedDate date={item.created} isLoading={isLoading} />
        )}

      {(item.scheduledStartDate != null || item.scheduledEndDate != null) && (
        <ItemCardScheduledSale
          startDate={item.scheduledStartDate ?? null}
          endDate={item.scheduledEndDate ?? null}
          isLoading={isLoading}
        />
      )}

      {item.itemType === ItemType.Bundle && (
        <ItemCardModerationStatus
          bundleModerationStatus={item.bundleModerationStatus}
          isLoading={isLoading}
        />
      )}

      {item.itemType === ItemType.ExperienceSubscription &&
        typeof item.productStatus !== 'undefined' && (
          <ItemCardDeveloperSubscriptionsProductStatus
            productStatus={item.productStatus}
            isLoading={isLoading}
          />
        )}

      {(item.itemType === ItemType.Bundle || item.itemType === ItemType.CatalogAsset) &&
        item.isIEC &&
        typeof item.creatorName !== 'undefined' && (
          <AvatarCreationCardCreatorName
            creatorName={item.creatorName}
            isLoading={isLoading}
            creatorUserId={item.userId ?? 0}
          />
        )}

      {!item.hidePricingInfo &&
        !isOnLookPage &&
        (item.itemType === ItemType.LibraryAsset ||
          item.itemType === ItemType.CatalogAsset ||
          item.itemType === ItemType.Bundle ||
          item.itemType === ItemType.GamePass ||
          item.itemType === ItemType.AvatarCreationToken) &&
        typeof item.price !== 'undefined' && (
          <ItemCardPrice
            isSellable={
              item.itemType === ItemType.CatalogAsset || item.itemType === ItemType.Bundle
                ? (item.isSellable ?? false)
                : !(item.isIEC === true || item.isCreatedForBundle === true)
            }
            price={item.price}
            isLoading={isLoading}
            pricePrefix={
              item.itemType === ItemType.AvatarCreationToken
                ? `${translate('Label.ItemTypePrice', {
                    itemType: translate(getItemTypeDisplayName),
                  })}:`
                : ''
            }
          />
        )}

      {(item.itemType === ItemType.CatalogAsset || item.itemType === ItemType.Bundle) &&
        typeof item.isDelisted !== 'undefined' &&
        item.isDelisted && (
          <Typography variant='body2' color='secondary'>
            {translate('Label.Archived')}
          </Typography>
        )}

      {item.itemType === ItemType.ExperienceSubscription &&
        typeof item.subscriptionPrice !== 'undefined' && (
          <ItemCardFiatPrice price={item.subscriptionPrice} isLoading={isLoading} />
        )}

      {item.itemType === ItemType.ExperienceSubscription &&
        typeof item.activeSubscribers !== 'undefined' && (
          <ItemCardActiveSubscribers subscribers={item.activeSubscribers} isLoading={isLoading} />
        )}

      {item.itemType === ItemType.ExperienceSubscription && (
        <ItemCardExperienceSubscriptionsId
          id={item.subscriptionProductId ?? ''}
          isLoading={isLoading}
        />
      )}

      {item.itemType === ItemType.Badge && typeof item.isActive !== 'undefined' && (
        <ItemCardActivity isActive={item.isActive} isLoading={isLoading} />
      )}

      {(item.itemType === ItemType.TranslatorGame || item.itemType === ItemType.CatalogAsset) &&
        !item.isIEC &&
        typeof item.creatorName !== 'undefined' && (
          <ItemCardCreatorName creatorName={item.creatorName} isLoading={isLoading} />
        )}

      {item.itemType === ItemType.DeveloperProduct && typeof item.productId !== 'undefined' && (
        <ItemCardItemId id={item.productId} isLoading={isLoading} />
      )}

      {item.itemType === ItemType.Places && typeof item.isStartPlace !== 'undefined' && (
        <ItemCardStartPlace isStartPlace={item.isStartPlace} isLoading={isLoading} />
      )}

      {item.itemType === ItemType.Look && (
        <LookItemCardPrice
          price={item.price ?? null}
          isLoading={isLoading}
          itemCount={(item.lookAssets?.length ?? 0) + (item.lookBundles?.length ?? 0)}
        />
      )}
    </div>
  );

  return (
    <Grid
      data-testid='item-card-testId'
      container
      className={itemCardContainer}
      ref={containerRef}
      direction='column'>
      {item.itemType === ItemType.AvatarCreationToken && (
        <AvatarCreationTokenItemCardThumbnail
          type={thumbnailType}
          // TODO @asaxena UCP-1303
          // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- IDs are int64 and cannot be safely converted to JS number
          targetId={thumbnailTargetId as number}
          returnPolicy={returnPolicy}
          alt={item.name ?? ''}
          isPendingNewTarget={isLoading}
          includeBackground
          avatarCreationTokenItem={item}
        />
      )}
      {item.itemType !== ItemType.Event && item.itemType !== ItemType.AvatarCreationToken && (
        <Grid item className={thumbnailContainer}>
          <ItemThumbnail
            containerClass={itemCardImg}
            moderatedContainerClass={itemCardImg}
            type={thumbnailType}
            // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- IDs are int64 and cannot be safely converted to JS number
            targetId={thumbnailTargetId as number}
            bundleModerationStatus={item.bundleModerationStatus}
            returnPolicy={returnPolicy}
            alt={item.name ?? ''}
            isPendingNewTarget={isLoading}
            itemType={item.itemType}
          />
          {showTeamCreatePresenceIndicator && (
            <TeamCreatePresenceIndicator
              isLoading={isLoading}
              activeUsers={item.activeUsers}
              width={containerWidth}
            />
          )}
        </Grid>
      )}

      {typeof item.name !== 'undefined' && (
        <ItemCardLimitedChip isLoading={isLoading} isLimited={item.isLimited2 ?? false} />
      )}

      {isOnLookPage ? (
        <LookItemCardDescription item={item} isLoading={isLoading} />
      ) : (
        itemCardDescription
      )}
    </Grid>
  );
};

export default ItemCard;
