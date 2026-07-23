import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from '@rbx/intl';
import type { TMenuProps } from '@rbx/ui';
import {
  MenuItem,
  OpenInNewIcon,
  Divider,
  Menu,
  makeStyles,
  useSnackbar,
  ArrowDropDownRoundedIcon,
} from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import { analyticsPerformanceNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import buildExperienceAnalyticsUrlWithParams from '@modules/charts-generic/utils/analyticsUrlBuilder';
import { Item, toastDurationTime } from '@modules/miscellaneous/common';
import { getUrlForItemType } from '@modules/miscellaneous/urls';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import { useGetActivationEligibilityForUniverse } from '@modules/react-query/develop';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import ItemCardExperienceSubscriptionActivationButton from '../../experienceSubscriptions/components/ItemCardContextMenu/ItemCardExperienceSubscriptionActivationButton';
import ItemCardExperienceSubscriptionDeactivationButton from '../../experienceSubscriptions/components/ItemCardContextMenu/ItemCardExperienceSubscriptionDeactivationButton';
import ItemCardExperienceSubscriptionDeletionButton from '../../experienceSubscriptions/components/ItemCardContextMenu/ItemCardExperienceSubscriptionDeletionButton';
import ItemCardExperienceSubscriptionTakeOffSaleButton from '../../experienceSubscriptions/components/ItemCardContextMenu/ItemCardExperienceSubscriptionTakeOffSaleButton';
import AddVariantDialog from '../../itemConfiguration/components/AddVariantDialog';
import ItemCardMigratePlaceButton from '../../places/components/ItemCardMigratePlaceButton';
import type CreationData from '../interfaces/CreationData';
import ItemCardArchiveButton from './ItemCardArchiveButton';
import ItemCardDeleteLookButton from './ItemCardDeleteLookButton';
import ItemCardDelistButton from './ItemCardDelistButton';
import ItemCardPrivacyButton from './ItemCardPrivacyButton';
import ItemCardRemoveFromFolderButton from './ItemCardRemoveFromFolderButton';
import ItemCardRemovePlacesButton from './ItemCardRemovePlacesButton';
import ItemCardToggleSaleButton from './ItemCardToggleSaleButton';
import TrackedMenuItem from './TrackedMenuItem';

const useItemCardContextMenuStyles = makeStyles()((theme) => ({
  icon: {
    paddingLeft: 5,
  },

  redText: {
    // oxlint-disable-next-line typescript/no-deprecated
    color: theme.palette.error.dark,

    '&:hover': {
      // oxlint-disable-next-line typescript/no-deprecated
      color: theme.palette.error.dark,
    },
  },
  pullRight: {
    marginLeft: 'auto',
    display: 'flex',
  },
  none: {
    pointerEvents: 'none',
    '& :not(.MuiBackdrop-root)': {
      pointerEvents: 'auto',
    },
  },
}));

const Submenu = (props: TMenuProps) => {
  const {
    classes: { pullRight, none },
  } = useItemCardContextMenuStyles();
  const { open, anchorEl, onClose, children } = props;

  return (
    <>
      <span className={pullRight}>
        <ArrowDropDownRoundedIcon color='disabled' style={{ transform: 'rotate(270deg)' }} />
      </span>
      <Menu
        PopoverClasses={{
          root: none,
        }}
        open={open}
        anchorEl={anchorEl}
        onClose={onClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}>
        {children}
      </Menu>
    </>
  );
};

export interface ItemCardContextMenuProps {
  itemType: Item;
  creation: CreationData;
  removeItem: () => void;
  updateItemPrivacy: (isActive: boolean) => void;
  updateItem: (item: CreationData) => void;
  url?: string;
  handleClose: () => void;
  menuOpen?: boolean;
  anchorEl?: TMenuProps['anchorEl'];
  creatorIsEligibleForGuidelines?: boolean;
  toggleEnableItem?: (enable: boolean) => void;
  isMarketplaceAssetType?: boolean;
  isVariantAllowed?: boolean;
}

const ItemCardContextMenu: FunctionComponent<React.PropsWithChildren<ItemCardContextMenuProps>> = ({
  itemType,
  creation,
  removeItem,
  updateItemPrivacy,
  updateItem,
  url,
  handleClose,
  menuOpen = false,
  anchorEl,
  creatorIsEligibleForGuidelines = true,
  toggleEnableItem,
  isMarketplaceAssetType,
  isVariantAllowed,
}) => {
  const copyMenuItemRef = React.useRef<HTMLLIElement | null>(null);
  const [activeSubmenu, setActiveSubmenu] = useState('');
  const { translate } = useTranslation();
  const { enqueue, close: closeSnackbar } = useSnackbar();
  const { settings } = useSettings();
  const {
    classes: { redText, icon },
  } = useItemCardContextMenuStyles();
  const { user } = useAuthentication();

  const router = useRouter();
  const onlyShowToggleEnableMenuItem = useMemo(() => {
    return !!toggleEnableItem && creation.universeProductConfigEnabled !== undefined;
  }, [toggleEnableItem, creation.universeProductConfigEnabled]);

  const { data: activationEligibility, isError } = useGetActivationEligibilityForUniverse(
    itemType === Item.Game ? creation.universeId : undefined,
  );
  // If there's an error, assume the user is eligible. final save will block if they are not eligible.
  const isActivationEligible = isError ? true : (activationEligibility?.isEligible ?? false);

  const shouldShowPrivacyButton = useMemo(() => {
    if (itemType !== Item.Game || creation.isArchived) {
      return false;
    }
    if (creation.isActive) {
      return true;
    }
    return isActivationEligible;
  }, [itemType, creation.isArchived, creation.isActive, isActivationEligible]);

  const [showAddVariantDialog, setShowAddVariantDialog] = useState(false);
  const itemId = useMemo(() => {
    // oxlint-disable-next-line typescript/switch-exhaustiveness-check
    switch (itemType) {
      case Item.Bundle:
        return creation.bundleId;
      case Item.Look:
        return creation.lookId;
      default:
        return creation.assetId;
    }
  }, [itemType, creation.bundleId, creation.lookId, creation.assetId]);

  const showBottomMsg = useCallback(
    (msg: string) => {
      enqueue({
        message: <span data-testid='success-message'>{msg}</span>,
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
        autoHideDuration: toastDurationTime,
        autoHide: true,
        onClose: closeSnackbar,
      });
    },
    [enqueue, closeSnackbar],
  );

  const onSubmenuClose = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      setActiveSubmenu('');
    },
    [setActiveSubmenu],
  );

  const onClose = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      onSubmenuClose(event);
      handleClose();
    },
    [onSubmenuClose, handleClose],
  );

  function handleSubmenuToggle(name: string) {
    setActiveSubmenu((current) => (current !== name ? name : ''));
  }

  const copyText = (event: React.MouseEvent, text?: string, itemName?: string) => {
    event.preventDefault();
    void navigator.clipboard.writeText(text ?? '').then(() => {
      if (translate && itemName) {
        showBottomMsg(translate('Message.CopySuccess', { item: itemName }));
      }
    });
    onClose(event);
  };

  const getCopyIdKey = () => {
    // oxlint-disable-next-line typescript/switch-exhaustiveness-check
    switch (itemType) {
      case Item.Game:
        return 'Action.CopyStartPlaceID';
      case Item.Bundle:
        return 'Action.CopyBundleID';
      case Item.ExperienceSubscription:
        return 'Action.CopySubscriptionID';
      case Item.AvatarCreationToken:
        return 'Action.CopyTokenID';
      case Item.Look:
        return 'Action.CopyLookID';
      default:
        return 'Action.CopyAssetID';
    }
  };

  const shouldShowCopyUrl = Boolean(url && !onlyShowToggleEnableMenuItem && !creation.isIEC);
  const shouldShowCopyUniverseId = itemType === Item.Game && process.env.buildTarget !== 'luobu';
  const shouldShowCopyAssetUri =
    itemType === Item.CatalogAsset ||
    (itemType === Item.LibraryAsset && !onlyShowToggleEnableMenuItem);

  const shouldShowCopyMenu =
    shouldShowCopyUrl || shouldShowCopyUniverseId || shouldShowCopyAssetUri;

  const shouldShowRestartMenu = itemType === Item.Game && !creation.isArchived;

  // The analytics button should not be shown for items the user didn't create
  const shouldShowAnalyticsUrl =
    (itemType === Item.CatalogAsset || itemType === Item.Bundle) &&
    !onlyShowToggleEnableMenuItem &&
    !creation.isIEC &&
    user?.id === creation.userId;

  return (
    <Menu
      data-testid='experience-options-menu'
      open={menuOpen}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}>
      {url &&
        !onlyShowToggleEnableMenuItem &&
        !creation.isIEC && [
          <TrackedMenuItem
            onClick={() => {
              window.open(url, '_blank')?.focus();
            }}
            disabled={!creatorIsEligibleForGuidelines}
            itemKey='Action.OpenInNewTab'
            key='Action.OpenInNewTab'>
            {translate('Action.OpenInNewTab')}
          </TrackedMenuItem>,
        ]}
      {shouldShowCopyMenu && (
        <MenuItem ref={copyMenuItemRef} onClick={() => handleSubmenuToggle('copy')}>
          {translate('Action.CopySubmenu')}
          <Submenu
            open={activeSubmenu === 'copy'}
            anchorEl={() => copyMenuItemRef.current ?? document.body}
            onClose={onSubmenuClose}>
            {shouldShowCopyUrl && (
              <TrackedMenuItem
                onClick={(event: React.MouseEvent) => {
                  copyText(event, url, translate('Label.URL'));
                }}
                disabled={!creatorIsEligibleForGuidelines}
                itemKey='Action.CopyURL'>
                {translate('Action.CopyURL')}
              </TrackedMenuItem>
            )}
            {shouldShowCopyUniverseId && (
              <TrackedMenuItem
                onClick={(event: React.MouseEvent) => {
                  copyText(event, String(creation.universeId), translate('Label.UniverseID'));
                }}
                disabled={!creatorIsEligibleForGuidelines}
                itemKey='Action.CopyUniverseID'>
                {translate('Action.CopyUniverseID')}
              </TrackedMenuItem>
            )}
            {shouldShowCopyAssetUri && (
              <TrackedMenuItem
                itemKey='Action.CopyAssetURI'
                onClick={(event: React.MouseEvent) => {
                  copyText(event, `rbxassetid://${creation.assetId}`, translate('Label.AssetURI'));
                }}>
                {translate('Action.CopyAssetURI')}
              </TrackedMenuItem>
            )}
          </Submenu>
        </MenuItem>
      )}
      {itemType === Item.Game && [
        process.env.buildTarget !== 'luobu' && (
          <TrackedMenuItem
            disabled={!creatorIsEligibleForGuidelines}
            onClick={() => {
              window
                .open(
                  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
                  getUrlForItemType(Item.Game, (creation.assetId as number) ?? 0) ?? '',
                  '_blank',
                )
                ?.focus();
            }}
            itemKey='Action.OpenExperienceDetails'
            key='Action.OpenExperienceDetails'>
            {translate('Action.OpenExperienceDetails')}
            <OpenInNewIcon className={icon} />
          </TrackedMenuItem>
        ),
      ]}
      {itemType !== Item.Places &&
        itemType !== Item.CreatedPlaces &&
        !onlyShowToggleEnableMenuItem && (
          <TrackedMenuItem
            onClick={(event: React.MouseEvent) => {
              let id;
              let translateKey = 'Label.AssetID';
              // oxlint-disable-next-line typescript/switch-exhaustiveness-check
              switch (itemType) {
                case Item.DeveloperProduct:
                  id = creation.productId;
                  break;
                case Item.Bundle:
                  translateKey = 'Label.BundleID';
                  id = creation.bundleId;
                  break;
                case Item.ExperienceSubscription:
                  translateKey = 'Label.ProductID';
                  id = creation.subscriptionProductId;
                  break;
                case Item.AvatarCreationToken:
                  translateKey = 'Label.TokenID';
                  id = creation.assetId;
                  break;
                case Item.Look:
                  translateKey = 'Label.LookID';
                  id = creation.lookId;
                  break;
                default:
                  id = creation.assetId;
                  break;
              }
              copyText(event, String(id), translate(translateKey));
            }}
            itemKey={getCopyIdKey()}
            disabled={!creatorIsEligibleForGuidelines}>
            {translate(getCopyIdKey())}
          </TrackedMenuItem>
        )}
      {shouldShowAnalyticsUrl && (
        <TrackedMenuItem
          itemKey='Action.Analytics'
          onClick={() => {
            if (itemId !== undefined) {
              /* oxlint-disable typescript/no-unsafe-type-assertion */
              void router.push(
                itemType === Item.Bundle
                  ? dashboard.getBundleAnalyticsUrl(itemId as number)
                  : dashboard.getCatalogAnalyticsUrl(itemId as number),
              );
              /* oxlint-enable typescript/no-unsafe-type-assertion */
            }
          }}>
          {translate('Action.Analytics')}
        </TrackedMenuItem>
      )}

      {/* TODO @mryumae: replace with translation */}
      {isVariantAllowed && (
        <TrackedMenuItem
          itemKey='Action.AddVariant'
          onClick={() => {
            setShowAddVariantDialog(true);
          }}>
          Lorem ipsum
        </TrackedMenuItem>
      )}

      {settings.enableItemDelisting &&
        (itemType === Item.CatalogAsset || itemType === Item.Bundle) &&
        !creation.isIEC &&
        !onlyShowToggleEnableMenuItem && (
          <ItemCardDelistButton
            creation={creation}
            handleClose={handleClose}
            removeItem={removeItem}
            itemType={itemType}
          />
        )}

      {itemType === Item.CatalogAsset && onlyShowToggleEnableMenuItem && (
        <TrackedMenuItem
          className={creation.universeProductConfigEnabled ? redText : ''}
          value={+!creation.universeProductConfigEnabled}
          itemKey={creation.universeProductConfigEnabled ? 'Label.DisableSale' : 'Label.EnableSale'}
          onClick={(event: React.MouseEvent) => {
            // oxlint-disable-next-line typescript/no-unsafe-type-assertion
            toggleEnableItem?.(!!(event.target as HTMLInputElement).value);
            handleClose();
          }}>
          {creation.universeProductConfigEnabled
            ? translate('Label.DisableSale')
            : translate('Label.EnableSale')}
        </TrackedMenuItem>
      )}
      {itemType === Item.Game && [
        <Divider key='topDivider' />,
        <TrackedMenuItem
          data-testid='experience-menu-item-localization'
          onClick={() =>
            router.push(`/dashboard/creations/experiences/${creation.universeId}/localization`)
          }
          disabled={!creatorIsEligibleForGuidelines}
          itemKey='Action.ConfigureLocalization'
          key='Action.ConfigureLocalization'>
          {translate('Action.ConfigureLocalization')}
        </TrackedMenuItem>,
        process.env.buildTarget !== 'luobu' && (
          <TrackedMenuItem
            data-testid='experience-menu-item-badge'
            onClick={() =>
              router.push(`/dashboard/creations/experiences/${creation.universeId}/badges/create`)
            }
            disabled={!creatorIsEligibleForGuidelines}
            itemKey='Action.CreateBadge'
            key='Action.CreateBadge'>
            {translate('Action.CreateBadge')}
          </TrackedMenuItem>
        ),
        <TrackedMenuItem
          data-testid='experience-menu-item-devEx'
          onClick={() =>
            router.push(
              buildExperienceAnalyticsUrlWithParams(
                analyticsPerformanceNavigationItem,
                {},
                creation.universeId ?? 0,
              ),
            )
          }
          disabled={!creatorIsEligibleForGuidelines}
          itemKey='Action.ViewRealTimeStats'
          key='Action.ViewRealTimeStats'>
          {translate('Action.ViewRealTimeStats')}
        </TrackedMenuItem>,
        <Divider key='divider' />,
      ]}
      {shouldShowPrivacyButton && [
        <ItemCardPrivacyButton
          creation={creation}
          updateItemPrivacy={updateItemPrivacy}
          handleClose={handleClose}
          key='Action.PrivacyUpdate'
          isDisabled={!creatorIsEligibleForGuidelines}
        />,
      ]}
      {itemType === Item.ExperienceSubscription && [
        <ItemCardExperienceSubscriptionActivationButton
          key='Action.Activate'
          creation={creation}
          handleClose={handleClose}
          updateItem={updateItem}
        />,
        <ItemCardExperienceSubscriptionDeactivationButton
          key='Action.Deactivate'
          creation={creation}
          handleClose={handleClose}
          updateItem={updateItem}
        />,
        <ItemCardExperienceSubscriptionTakeOffSaleButton
          key='Action.TakeOffSale'
          creation={creation}
          handleClose={handleClose}
          updateItem={updateItem}
        />,
        <ItemCardExperienceSubscriptionDeletionButton
          key='Action.Delete'
          creation={creation}
          removeItem={removeItem}
        />,
      ]}
      {shouldShowRestartMenu && (
        <TrackedMenuItem
          onClick={() => {
            void router.push(
              `/dashboard/creations/experiences/${creation.universeId}/server-management`,
            );
            handleClose();
          }}
          itemKey='Action.RestartServersSubmenu'
          disabled={!creatorIsEligibleForGuidelines}>
          {translate('SelectablePlacesTable.Button.RestartServers')}
        </TrackedMenuItem>
      )}
      {creation.isDirectlyArchivable && (
        <ItemCardArchiveButton
          itemType={itemType}
          creation={creation}
          removeItem={removeItem}
          handleClose={handleClose}
          isDisabled={!creatorIsEligibleForGuidelines}
        />
      )}
      {(itemType === Item.Places || itemType === Item.CreatedPlaces) && !creation.isStartPlace && (
        <ItemCardRemovePlacesButton
          creation={creation}
          removeItem={removeItem}
          handleClose={handleClose}
          key='Action.RemovePlaces'
          isDisabled={!creatorIsEligibleForGuidelines}
        />
      )}
      {itemType === Item.Places && (
        <ItemCardMigratePlaceButton
          creation={creation}
          handleClose={handleClose}
          key='Action.MigrateToLatestUpdate'
          isDisabled={!creatorIsEligibleForGuidelines}
        />
      )}
      {isMarketplaceAssetType && itemType !== Item.AvatarCreationToken && !creation.isIEC && (
        <ItemCardToggleSaleButton
          creation={creation}
          updateItem={updateItem}
          handleClose={handleClose}
          key='Action.ToggleSale'
        />
      )}

      {isVariantAllowed && (
        <AddVariantDialog
          showAddVariantDialog={showAddVariantDialog}
          setShowAddVariantDialog={setShowAddVariantDialog}
          itemType={itemType}
          // oxlint-disable-next-line typescript/no-unsafe-type-assertion
          itemId={itemId as number}
        />
      )}

      {creation.containingFolderId !== undefined && (
        <ItemCardRemoveFromFolderButton
          key='Action.RemoveItemFromFolder'
          creation={creation}
          handleClose={handleClose}
          removeItem={removeItem}
        />
      )}
      {itemType === Item.Look && (
        <ItemCardDeleteLookButton lookId={creation.lookId?.toString() ?? ''} />
      )}
    </Menu>
  );
};

export default ItemCardContextMenu;
