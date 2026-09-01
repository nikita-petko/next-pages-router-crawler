import { useQueryClient } from '@tanstack/react-query';
import NextLink from 'next/link';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { ProductStatusType, CurrencyType } from '@rbx/client-developer-subscriptions-api/v1';
import { numberFormatter } from '@rbx/core';
import { Badge } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import {
  Avatar,
  FileCopyOutlinedIcon,
  IconButton,
  Link,
  makeStyles,
  Menu,
  MenuItem,
  MoreVertIcon,
  RobuxIcon,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type CreationData from '@modules/creations/common/interfaces/CreationData';
import ItemCardExperienceSubscriptionActivationButton from '@modules/creations/experienceSubscriptions/components/ItemCardContextMenu/ItemCardExperienceSubscriptionActivationButton';
import ItemCardExperienceSubscriptionDeactivationButton from '@modules/creations/experienceSubscriptions/components/ItemCardContextMenu/ItemCardExperienceSubscriptionDeactivationButton';
import ItemCardExperienceSubscriptionDeletionButton from '@modules/creations/experienceSubscriptions/components/ItemCardContextMenu/ItemCardExperienceSubscriptionDeletionButton';
import ItemCardExperienceSubscriptionTakeOffSaleButton from '@modules/creations/experienceSubscriptions/components/ItemCardContextMenu/ItemCardExperienceSubscriptionTakeOffSaleButton';
import { Item } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { subscriptionKeys } from '../queries/constants';
import type { InfiniteListSubscriptionsData } from '../queries/useInfiniteListSubscriptions';
import type { SubscriptionCreatorDetails } from '../types/SubscriptionCreatorDetails';
import getConfigureSubscriptionLink from './common/constants';

const useStyles = makeStyles()(() => ({
  hidden: {
    visibility: 'hidden',
    opacity: 0,
    transition: 'all 0.1s ease-in',
  },
  visible: {
    visibility: 'visible',
    opacity: 1,
    transition: 'all 0.1s ease-in',
  },
}));

const productStatusToTranslationKey = (status: ProductStatusType) => {
  switch (status) {
    case ProductStatusType.Active:
      return translationKey('ProductStatus.Active', TranslationNamespace.ExperienceSubscriptions);
    case ProductStatusType.OffSale:
    case ProductStatusType.Inactive:
    case ProductStatusType.ToBeActivated:
    case ProductStatusType.ToBeDeactivated:
      return translationKey('ProductStatus.Inactive', TranslationNamespace.ExperienceSubscriptions);
    case ProductStatusType.ToBeDeleted:
    case ProductStatusType.Deleted:
      return translationKey('ProductStatus.Deleted', TranslationNamespace.ExperienceSubscriptions);
    default: {
      const exhaustiveCheck: never | undefined = status;
      throw new Error(`Unrecognized product status ${exhaustiveCheck}.`);
    }
  }
};

type Props = SubscriptionCreatorDetails & {
  universeId: number;
};

function SubscriptionsTableRow({ universeId, ...subscription }: Props) {
  const { translate } = useTranslation();
  const { classes } = useStyles();
  const queryClient = useQueryClient();

  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isSubscriptionIdHovered, setIsSubscriptionIdHovered] = useState<boolean>(false);
  const [isSubscriptionIdCopied, setIsSubscriptionIdCopied] = useState<boolean>(false);
  const [isMoreOptionsMenuOpen, setIsMoreOptionsMenuOpen] = useState<boolean>(false);

  const rowRef = useRef<HTMLTableRowElement>(null);
  const moreOptionsButtonRef = useRef<HTMLButtonElement>(null);

  const handleCloseMenuItem = useCallback((e?: React.MouseEvent) => {
    setIsMoreOptionsMenuOpen(false);

    if (e) {
      const bounds = rowRef.current?.getBoundingClientRect();
      if (
        bounds &&
        (e.clientX < bounds.left ||
          e.clientX > bounds.right ||
          e.clientY < bounds.top ||
          e.clientY > bounds.bottom)
      ) {
        setIsHovered(false);
      }
    }
  }, []);

  const handleCopySubscriptionId = useCallback(() => {
    navigator.clipboard.writeText(`EXP-${subscription.id}`);
    setIsSubscriptionIdCopied(true);
  }, [subscription.id]);

  const copySubscriptionIdTooltipId = `copy-subscriptionId-${subscription.id}-tooltip`;
  const moreOptionsMenuId = `more-options-${subscription.id}-menu`;

  const configureSubscriptionLink = getConfigureSubscriptionLink(universeId, subscription.id);

  const isRobuxPrice =
    subscription.currencyType === CurrencyType.Robux && subscription.priceInRobux != null;

  const displayPrice = (() => {
    if (isRobuxPrice) {
      return `${subscription.priceInRobux}`;
    }
    if (subscription.price) {
      return numberFormatter(
        (subscription.price.units ?? 0) + (subscription.price.cents ?? 0) / 100,
        'currency',
      );
    }
    return '-';
  })();

  const regionalPricingBadge = useMemo(() => {
    const className = 'flex justify-center min-width-1600';
    if (subscription.isRegionalPricingEnabled === true) {
      return <Badge label={translate('Label.Enabled')} variant='Neutral' className={className} />;
    }
    if (subscription.isRegionalPricingEnabled === false) {
      return <Badge label={translate('Label.Disabled')} variant='Warning' className={className} />;
    }
    return <Badge label={translate('Label.NA')} variant='Neutral' className={className} />;
  }, [subscription.isRegionalPricingEnabled, translate]);

  // Adapter to convert SubscriptionCreatorDetails → CreationData for reusing existing context menu buttons
  const creationData: CreationData = {
    itemType: Item.ExperienceSubscription,
    isClickable: true,
    subscriptionProductId: `EXP-${subscription.id}`,
    universeId,
    name: subscription.name,
    productStatus: subscription.productStatusType,
    subscriptionPrice: subscription.price ?? undefined,
  };

  const invalidateSubscriptions = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: subscriptionKeys.all(universeId) });
  }, [queryClient, universeId]);

  const handleUpdateItem = useCallback(
    (updatedItem: CreationData) => {
      queryClient.setQueriesData<InfiniteListSubscriptionsData>(
        { queryKey: subscriptionKeys.all(universeId) },
        (oldData) => {
          if (!oldData) {
            return oldData;
          }
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              subscriptions: page.subscriptions.map((sub) =>
                sub.id === subscription.id
                  ? { ...sub, productStatusType: updatedItem.productStatus as ProductStatusType }
                  : sub,
              ),
            })),
          };
        },
      );
      invalidateSubscriptions();
    },
    [queryClient, universeId, subscription.id, invalidateSubscriptions],
  );

  const handleRemoveItem = useCallback(() => {
    queryClient.setQueriesData<InfiniteListSubscriptionsData>(
      { queryKey: subscriptionKeys.all(universeId) },
      (oldData) => {
        if (!oldData) {
          return oldData;
        }
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            subscriptions: page.subscriptions.filter((sub) => sub.id !== subscription.id),
          })),
        };
      },
    );
    invalidateSubscriptions();
  }, [queryClient, universeId, subscription.id, invalidateSubscriptions]);

  return (
    <TableRow
      ref={rowRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}>
      {/* Name */}
      <TableCell>
        <Link
          component={NextLink}
          href={configureSubscriptionLink}
          className='flex items-center gap-small'
          color='inherit'>
          <Avatar variant='rounded' alt={subscription.name}>
            <Thumbnail2d
              targetId={subscription.imageAssetId ?? 0}
              type={ThumbnailTypes.assetThumbnail}
              returnPolicy={ReturnPolicy.PlaceHolder}
              alt=''
            />
          </Avatar>
          <Typography variant='body2'>{subscription.name}</Typography>
        </Link>
      </TableCell>

      {/* Status */}
      <TableCell>
        <Badge
          label={translate(productStatusToTranslationKey(subscription.productStatusType).key)}
          variant='Neutral'
        />
      </TableCell>

      {/* Subscription ID */}
      <TableCell
        onMouseEnter={() => setIsSubscriptionIdHovered(true)}
        onMouseLeave={() => {
          setIsSubscriptionIdHovered(false);
          setIsSubscriptionIdCopied(false);
        }}>
        <div className='flex items-center gap-xsmall'>
          <span className='content-default'>EXP-{subscription.id}</span>
          {isSubscriptionIdHovered && (
            <Tooltip
              id={copySubscriptionIdTooltipId}
              title={
                isSubscriptionIdCopied
                  ? translate('Message.Copied')
                  : translate('Action.CopySubscriptionID')
              }
              placement='top'
              arrow>
              <IconButton
                className={isSubscriptionIdHovered ? classes.visible : classes.hidden}
                size='small'
                onClick={handleCopySubscriptionId}
                aria-label={translate('Action.CopySubscriptionID')}
                aria-describedby={copySubscriptionIdTooltipId}>
                <FileCopyOutlinedIcon fontSize='small' sx={{ color: 'grey' }} aria-hidden />
              </IconButton>
            </Tooltip>
          )}
        </div>
      </TableCell>

      {/* Price */}
      <TableCell>
        {isRobuxPrice ? (
          <span className='flex items-center gap-xsmall'>
            <RobuxIcon fontSize='small' color='inherit' />
            {displayPrice}
          </span>
        ) : (
          <span className='content-default'>{displayPrice}</span>
        )}
      </TableCell>

      {/* Regional pricing */}
      <TableCell>{regionalPricingBadge}</TableCell>

      {/* Actions */}
      <TableCell padding='checkbox' align='center'>
        <IconButton
          ref={moreOptionsButtonRef}
          className={isHovered || isMoreOptionsMenuOpen ? classes.visible : classes.hidden}
          size='small'
          color='secondary'
          aria-label={translate('Action.MoreOptions')}
          aria-haspopup='true'
          aria-controls={moreOptionsMenuId}
          onClick={() => setIsMoreOptionsMenuOpen(true)}>
          <MoreVertIcon aria-hidden />
        </IconButton>

        <Menu
          id={moreOptionsMenuId}
          anchorEl={moreOptionsButtonRef.current}
          open={isMoreOptionsMenuOpen}
          onClose={() => handleCloseMenuItem()}
          transformOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <MenuItem
            component={NextLink}
            target='_blank'
            href={configureSubscriptionLink}
            onClick={(e: React.MouseEvent) => handleCloseMenuItem(e)}>
            {translate('Action.EditSettings')}
          </MenuItem>
          <MenuItem
            onClick={(e: React.MouseEvent) => {
              handleCopySubscriptionId();
              handleCloseMenuItem(e);
            }}>
            {translate('Action.CopySubscriptionID')}
          </MenuItem>
          {(subscription.productStatusType === ProductStatusType.Inactive ||
            subscription.productStatusType === ProductStatusType.OffSale) && (
            <ItemCardExperienceSubscriptionActivationButton
              creation={creationData}
              handleClose={() => handleCloseMenuItem()}
              updateItem={handleUpdateItem}
            />
          )}
          {subscription.productStatusType === ProductStatusType.Active && (
            <ItemCardExperienceSubscriptionTakeOffSaleButton
              creation={creationData}
              handleClose={() => handleCloseMenuItem()}
              updateItem={handleUpdateItem}
            />
          )}
          {subscription.productStatusType === ProductStatusType.OffSale && (
            <ItemCardExperienceSubscriptionDeactivationButton
              creation={creationData}
              handleClose={() => handleCloseMenuItem()}
              updateItem={handleUpdateItem}
            />
          )}
          <ItemCardExperienceSubscriptionDeletionButton
            creation={creationData}
            removeItem={handleRemoveItem}
          />
        </Menu>
      </TableCell>
    </TableRow>
  );
}

export default memo(SubscriptionsTableRow);
