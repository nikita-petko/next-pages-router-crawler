import type { FunctionComponent } from 'react';
import { useCallback, useState } from 'react';
import { Icon, Menu, MenuItem, MenuSection } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { CreatorInventoryAssetType } from '@modules/clients/creatorInventory';
import developClient from '@modules/clients/develop';
import tryParseResponseError from '@modules/clients/utils/tryParseResponseError';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { toast } from '@modules/monetization-shared/snackbar/actions';
import {
  logDevelopmentItemsMenuAction,
  type DevelopmentItemsMenuAction,
  type DevelopmentItemsMenuSource,
} from '../developmentItemsAnalytics';
import {
  canConfigureDevelopmentItem,
  hasDevelopmentItemCreatorStorePage,
  type DevelopmentItemsInventoryItem,
} from '../developmentItemsInventoryUtils';
import type { DevelopmentItemToolboxIds } from '../useDevelopmentItemToolboxIds';

const ARCHIVING_PREVENTED_FOR_WEARABLE_ERROR_CODE = 21;

export type DevelopmentItemArchiveStateChangeHandler = (
  item: DevelopmentItemsInventoryItem,
  state: NonNullable<DevelopmentItemsInventoryItem['state']>,
) => void;

export type DevelopmentItemActionsProps = {
  isArchivable: boolean;
  item: DevelopmentItemsInventoryItem;
  onArchiveStateChange: DevelopmentItemArchiveStateChangeHandler;
  onConfigureAsset: (item: DevelopmentItemsInventoryItem) => void;
  onViewAssetDetails: (item: DevelopmentItemsInventoryItem) => void;
  toolboxIds?: DevelopmentItemToolboxIds;
};

export type DevelopmentItemActionsMenuContentProps = DevelopmentItemActionsProps & {
  menuSource: DevelopmentItemsMenuSource;
  onClose: () => void;
};

const DevelopmentItemActionsMenuContent: FunctionComponent<
  DevelopmentItemActionsMenuContentProps
> = ({
  isArchivable,
  item,
  menuSource,
  onArchiveStateChange,
  onClose,
  onConfigureAsset,
  onViewAssetDetails,
  toolboxIds,
}) => {
  const intl = useTranslation();
  const { translate } = intl;
  const { tPendingTranslation } = useTranslationWrapper(intl);
  const [isUpdatingArchiveState, setIsUpdatingArchiveState] = useState(false);
  const copyAssetIdLabel = translate('Action.CopyAssetID');
  const assetIdItemName = translate('Label.AssetID');
  const copyMeshIdLabel = tPendingTranslation(
    'Copy Mesh ID',
    'Kebab menu action to copy a MeshPart mesh ID',
    translationKey('Action.CopyMeshID', TranslationNamespace.Creations),
  );
  const meshIdItemName = tPendingTranslation(
    'Mesh ID',
    'Item name shown in the "Copied {item}" snackbar after copying a mesh ID',
    translationKey('Label.MeshID', TranslationNamespace.Creations),
  );
  const copyTextureIdLabel = tPendingTranslation(
    'Copy Texture ID',
    'Kebab menu action to copy a Decal or MeshPart texture ID',
    translationKey('Action.CopyTextureID', TranslationNamespace.Creations),
  );
  const textureIdItemName = tPendingTranslation(
    'Texture ID',
    'Item name shown in the "Copied {item}" snackbar after copying a texture ID',
    translationKey('Label.TextureID', TranslationNamespace.Creations),
  );
  const configureAssetLabel = tPendingTranslation(
    'Configure Asset',
    'Development Items menu action that opens an asset configuration page.',
    translationKey('Action.DevelopmentItems.ConfigureAsset', TranslationNamespace.Creations),
  );
  const viewAssetDetailsLabel = tPendingTranslation(
    'View Asset Details',
    'Development Items menu action that opens an asset in Creator Store.',
    translationKey('Action.DevelopmentItems.ViewAssetDetails', TranslationNamespace.Creations),
  );
  const isArchived = item.state === 'Archived';
  const isConfigurable = canConfigureDevelopmentItem(item);
  const hasCreatorStorePage = hasDevelopmentItemCreatorStorePage(item.assetType);
  const archiveActionLabel = translate(isArchived ? 'Action.Restore' : 'Action.Archive');
  const meshId =
    item.assetType === CreatorInventoryAssetType.MeshPart ? toolboxIds?.meshId : undefined;
  const textureId =
    item.assetType === CreatorInventoryAssetType.Decal ||
    item.assetType === CreatorInventoryAssetType.MeshPart
      ? toolboxIds?.textureId
      : undefined;

  const handleConfigureAsset = useCallback(() => {
    logDevelopmentItemsMenuAction(item, 'configure_asset', menuSource);
    onClose();
    onConfigureAsset(item);
  }, [item, menuSource, onClose, onConfigureAsset]);
  const handleViewAssetDetails = useCallback(() => {
    logDevelopmentItemsMenuAction(item, 'open_asset_details', menuSource);
    onClose();
    onViewAssetDetails(item);
  }, [item, menuSource, onClose, onViewAssetDetails]);
  const copyId = useCallback(
    (value: number, itemName: string, action: DevelopmentItemsMenuAction) => {
      logDevelopmentItemsMenuAction(item, action, menuSource);
      onClose();
      void navigator.clipboard.writeText(value.toString()).then(() => {
        toast({ title: translate('Message.CopySuccess', { item: itemName }) });
      });
    },
    [item, menuSource, onClose, translate],
  );
  const handleCopyAssetId = useCallback(() => {
    copyId(item.assetId, assetIdItemName, 'copy_asset_id');
  }, [assetIdItemName, copyId, item.assetId]);
  const handleToggleArchiveState = useCallback(async () => {
    logDevelopmentItemsMenuAction(item, isArchived ? 'restore_asset' : 'archive_asset', menuSource);
    setIsUpdatingArchiveState(true);
    try {
      if (isArchived) {
        await developClient.restoreAsset(item.assetId);
      } else {
        await developClient.archiveAsset(item.assetId);
      }
      onClose();
      onArchiveStateChange(item, isArchived ? 'Active' : 'Archived');
      toast({
        icon: 'icon-regular-circle-check',
        title: translate(isArchived ? 'Message.RestoreSuccess' : 'Message.ArchiveSuccess'),
      });
    } catch (error) {
      const responseError = await tryParseResponseError(error);
      toast({
        icon: 'icon-regular-circle-x',
        title: translate(
          !isArchived && responseError?.code === ARCHIVING_PREVENTED_FOR_WEARABLE_ERROR_CODE
            ? 'Response.ArchivingPreventedForWearableAsset'
            : 'Response.UnknownError',
        ),
      });
    } finally {
      setIsUpdatingArchiveState(false);
    }
  }, [isArchived, item, menuSource, onArchiveStateChange, onClose, translate]);

  return (
    <Menu className='padding-small' size='Medium'>
      <MenuSection>
        {isConfigurable && (
          <MenuItem
            leading={<Icon name='icon-regular-pencil' size='Medium' />}
            onSelect={handleConfigureAsset}
            title={configureAssetLabel}
            value='configure-asset'
          />
        )}
        {hasCreatorStorePage && (
          <MenuItem
            leading={<Icon name='icon-regular-arrow-up-right-from-square' size='Medium' />}
            onSelect={handleViewAssetDetails}
            title={viewAssetDetailsLabel}
            value='view-asset-details'
          />
        )}
        <MenuItem onSelect={handleCopyAssetId} title={copyAssetIdLabel} value='copy-asset-id' />
        {meshId != null && meshId > 0 && (
          <MenuItem
            onSelect={() => copyId(meshId, meshIdItemName, 'copy_mesh_id')}
            title={copyMeshIdLabel}
            value='copy-mesh-id'
          />
        )}
        {textureId != null && textureId > 0 && (
          <MenuItem
            onSelect={() => copyId(textureId, textureIdItemName, 'copy_texture_id')}
            title={copyTextureIdLabel}
            value='copy-texture-id'
          />
        )}
        {isArchivable && (
          <MenuItem
            disabled={isUpdatingArchiveState}
            onSelect={() => {
              void handleToggleArchiveState();
            }}
            title={archiveActionLabel}
            value={isArchived ? 'restore-asset' : 'archive-asset'}
          />
        )}
      </MenuSection>
    </Menu>
  );
};

export default DevelopmentItemActionsMenuContent;
