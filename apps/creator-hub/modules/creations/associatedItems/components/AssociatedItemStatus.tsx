import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from '@rbx/intl';
import { ThumbnailTypes, ThumbnailResponseState, ThumbnailClient } from '@rbx/thumbnails';
import {
  Avatar,
  ListItem,
  ListItemAvatar,
  HourglassEmptyIcon,
  ImageIcon,
  BlockIcon,
  Skeleton,
  List,
  ListItemSecondaryAction,
  ListItemText,
  MenuItem,
} from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { openDeveloperProductArchiveDialog } from '@modules/developer-products/components/DeveloperProductArchiveDialog';
import { Item, itemTypeToPath } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useMetricsMonitoring } from '@modules/miscellaneous/metricsMonitoring';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import type { ArchiveItemType } from '@modules/monetization-shared/archive-dialog/ArchiveConfirmationDialog';
import { useMonetizationFlags } from '@modules/monetization-shared/flags/useMonetizationFlags';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import useCurrentBadge from '../../badge/hooks/useCurrentBadge';
import CopyTextActionMenuItem from '../../common/components/CopyTextActionMenuItem';
import StatusCardContextMenu from '../../common/components/StatusCardContextMenu';
import { useCurrentDeveloperProduct } from '../../developerProduct/contexts/DeveloperProductContext';
import useCurrentExperienceSubscription from '../../experienceSubscriptions/hooks/useCurrentExperienceSubscription';
import { useCurrentPass } from '../../pass/contexts/PassContext';
import useAssociatedItemsStyles from './AssociatedItem.styles';

export interface AssociatedItemStatusProps {
  currentItemType?: Item;
}

/** Item types that can show an Archive/Unarchive action in the status menu. */
const ARCHIVABLE_ITEM_TYPES: Partial<Record<Item, ArchiveItemType>> = {
  [Item.DeveloperProduct]: 'developerProduct',
  // Game passes will plug in once their archive mutation path lands.
  // [Item.GamePass]: 'gamePass',
};

function ThumbnailImage({
  type,
  targetId,
  alt,
  isRefreshRequired = false,
}: {
  type?: ThumbnailTypes;
  targetId?: number;
  alt?: string | null;
  isRefreshRequired?: boolean;
}) {
  const {
    classes: { itemImageStyles },
  } = useAssociatedItemsStyles();

  const [responseState, setResponseState] = useState<ThumbnailResponseState>();
  const [imageUrl, setImageUrl] = useState<string>();

  const { error } = useMetricsMonitoring();

  const loadThumbnail = useCallback(async () => {
    try {
      if (type !== undefined && targetId !== undefined) {
        const response = await ThumbnailClient.getThumbnailImage(type, targetId);

        setResponseState(response?.state ?? ThumbnailResponseState.TemporarilyUnavailable);
        setImageUrl(response.imageUrl);
      }
    } catch (e) {
      if (e instanceof Error) {
        error(e.message);
      }
    }
  }, [error, type, targetId]);

  /* oxlint-disable react/react-compiler, typescript/no-floating-promises -- loadThumbnail is async but fire-and-forget; setState is called inside a callback, not synchronously in the effect body */
  // Load thumbnail on mount
  useEffect(() => {
    // oxlint-disable-next-line react/react-compiler -- setState fires after await, not synchronously; matches sibling useThumbnailImage load-on-mount pattern
    void loadThumbnail();
  }, [loadThumbnail]);

  // Reload thumbnail if refresh is required (stale thumbnails only)
  useEffect(() => {
    if (isRefreshRequired) {
      // oxlint-disable-next-line react/react-compiler -- setState fires after await, not synchronously; matches sibling useThumbnailImage load-on-mount pattern
      void loadThumbnail();
    }
  }, [isRefreshRequired, loadThumbnail]);
  /* oxlint-enable react/react-compiler, typescript/no-floating-promises */

  if (responseState === undefined) {
    return null;
  }

  // oxlint-disable-next-line typescript/switch-exhaustiveness-check -- remaining states all show the same placeholder icon
  switch (responseState) {
    case ThumbnailResponseState.Blocked:
      return <BlockIcon />;
    case ThumbnailResponseState.InReview:
      return <HourglassEmptyIcon />;
    case ThumbnailResponseState.Completed:
      return <img className={itemImageStyles} src={imageUrl} alt={alt ?? undefined} />;
    case ThumbnailResponseState.Error:
    case ThumbnailResponseState.Pending:
    case ThumbnailResponseState.TemporarilyUnavailable:
    default:
      return <ImageIcon />;
  }
}

const AssociatedItemStatus = ({ currentItemType }: AssociatedItemStatusProps) => {
  const { canConfigure } = useCurrentGame();

  const { badgeDetails, isBadgeRefreshRequired } = useCurrentBadge();
  const { developerProductDetails } = useCurrentDeveloperProduct();
  const { passDetails } = useCurrentPass();
  const { experienceSubscriptionDetails } = useCurrentExperienceSubscription();

  const { pathname, push } = useRouter();
  const universeIdResult = useUniverseId();
  const { isProductArchiveEnabled } = useMonetizationFlags('isProductArchiveEnabled');

  const unwrapped = useTranslation();
  const { translate } = unwrapped;
  const { tPendingTranslation } = useTranslationWrapper(unwrapped);

  /** "Asset ID" to copy */
  const itemAssetId = useMemo(() => {
    if (pathname.includes(itemTypeToPath[Item.Badge])) {
      return badgeDetails?.id;
    }
    if (pathname.includes(itemTypeToPath[Item.GamePass])) {
      return passDetails?.gamePassId;
    }
    if (pathname.includes(itemTypeToPath[Item.DeveloperProduct])) {
      return developerProductDetails?.productId;
    }
    if (pathname.includes(itemTypeToPath[Item.ExperienceSubscription])) {
      return experienceSubscriptionDetails?.imageAssetId ?? 0;
    }
    return undefined;
  }, [
    pathname,
    badgeDetails?.id,
    developerProductDetails?.productId,
    passDetails?.gamePassId,
    experienceSubscriptionDetails?.imageAssetId,
  ]);

  const itemName = useMemo(() => {
    if (pathname.includes(itemTypeToPath[Item.Badge])) {
      return badgeDetails?.name;
    }
    if (pathname.includes(itemTypeToPath[Item.GamePass])) {
      return passDetails?.name;
    }
    if (pathname.includes(itemTypeToPath[Item.DeveloperProduct])) {
      return developerProductDetails?.name;
    }
    if (pathname.includes(itemTypeToPath[Item.ExperienceSubscription])) {
      return experienceSubscriptionDetails?.name;
    }
    return undefined;
  }, [
    pathname,
    badgeDetails?.name,
    developerProductDetails?.name,
    passDetails?.name,
    experienceSubscriptionDetails?.name,
  ]);

  const [itemThumbnailType, itemThumbnailId] = useMemo(() => {
    if (pathname.includes(itemTypeToPath[Item.Badge])) {
      return [ThumbnailTypes.badgeIcon, badgeDetails?.id];
    }
    if (pathname.includes(itemTypeToPath[Item.GamePass])) {
      return [ThumbnailTypes.assetThumbnail, passDetails?.iconAssetId ?? 0];
    }
    if (pathname.includes(itemTypeToPath[Item.DeveloperProduct])) {
      return [ThumbnailTypes.assetThumbnail, developerProductDetails?.iconImageAssetId ?? 0];
    }
    if (pathname.includes(itemTypeToPath[Item.ExperienceSubscription])) {
      return [ThumbnailTypes.assetThumbnail, experienceSubscriptionDetails?.imageAssetId ?? 0];
    }
    return [undefined, undefined];
  }, [
    pathname,
    badgeDetails?.id,
    developerProductDetails?.iconImageAssetId,
    experienceSubscriptionDetails?.imageAssetId,
    passDetails?.iconAssetId,
  ]);

  const itemImage = useMemo(
    () => (
      <ThumbnailImage
        type={itemThumbnailType}
        targetId={itemThumbnailId}
        alt={itemName ?? undefined}
        isRefreshRequired={isBadgeRefreshRequired || false}
      />
    ),
    [isBadgeRefreshRequired, itemName, itemThumbnailId, itemThumbnailType],
  );

  const archiveItemType = currentItemType ? ARCHIVABLE_ITEM_TYPES[currentItemType] : undefined;
  const isArchived =
    archiveItemType === 'developerProduct' ? !!developerProductDetails?.isArchived : false;

  const canOpenArchiveDialog =
    !!archiveItemType &&
    itemAssetId !== undefined &&
    !universeIdResult.isError &&
    !universeIdResult.isLoading;

  const showArchiveAction = canOpenArchiveDialog && isProductArchiveEnabled;

  const handleArchiveClick = (event: MouseEvent) => {
    event.preventDefault();
    if (!canOpenArchiveDialog) {
      return;
    }

    const { universeId } = universeIdResult as { universeId: number };

    switch (archiveItemType) {
      case 'developerProduct':
        openDeveloperProductArchiveDialog({
          universeId,
          itemId: itemAssetId,
          isArchived,
          onSuccess: () => {
            void push(dashboard.getMonetizationDeveloperProductsUrl(universeId));
          },
        });
        return;
      case 'gamePass':
        // TODO(DMP-2775): wire game-pass archive mutation once GP archive lands.
        throw new Error('Archive is not yet supported for game passes');
      default: {
        const exhaustiveCheck: never = archiveItemType;
        throw new Error(`Unsupported archive item type: ${String(exhaustiveCheck)}`);
      }
    }
  };

  const menuItems = [
    <CopyTextActionMenuItem
      actionName={translate('Action.CopyAssetID')}
      itemName={translate('Label.AssetID')}
      key='copy-asset-id'
      actionKey='copyAssetId'
      textToCopy={itemAssetId?.toString()}
    />,
  ];

  if (showArchiveAction) {
    menuItems.push(
      <MenuItem key='archive' onClick={handleArchiveClick}>
        {isArchived
          ? tPendingTranslation(
              'Unarchive',
              'Label for the action to unarchive a monetization item.',
              translationKey('Action.Unarchive', TranslationNamespace.Creations),
            )
          : tPendingTranslation(
              'Archive',
              'Label for the action to archive a monetization item.',
              translationKey('Action.Archive', TranslationNamespace.Creations),
            )}
      </MenuItem>,
    );
  }

  return (
    <List disablePadding>
      {currentItemType && canConfigure && !!itemImage ? (
        <ListItem data-testid='item' disableGutters>
          <ListItemAvatar>
            <Avatar variant='rounded' alt={itemName ?? ''}>
              {itemImage}
            </Avatar>
          </ListItemAvatar>
          <ListItemText primary={itemName} />
          <ListItemSecondaryAction>
            <StatusCardContextMenu menuItems={menuItems} />
          </ListItemSecondaryAction>
        </ListItem>
      ) : (
        <Skeleton animate variant='rectangular' width={40} height={40} />
      )}
    </List>
  );
};

export default AssociatedItemStatus;
