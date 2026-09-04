import { useCallback, useMemo, type FunctionComponent } from 'react';
import { Button, ProgressCircle } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import useCurrentOrganization from '@modules/group/hooks/useCurrentOrganization';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import ImportQueue from '../../../manager/prototype/components/ImportQueue';
import { ImportProvider, useImport } from '../../../manager/prototype/ImportContext';
import type { ImportQueuePersistenceOwner } from '../../../manager/prototype/importQueuePersistence';
import type { InventoryScope } from '../../../manager/prototype/importStore';

export type DevelopmentItemsBulkUploadProps = {
  groupId?: number;
  onUploadComplete: () => void;
  userId?: number;
};

const DevelopmentItemsBulkUploadTrigger: FunctionComponent<DevelopmentItemsBulkUploadProps> = ({
  groupId,
  onUploadComplete,
  userId,
}) => {
  const intl = useTranslation();
  const { tPendingTranslation } = useTranslationWrapper(intl);
  const { importInProgress, openImporter } = useImport();
  const uploadAssetLabel = tPendingTranslation(
    'Upload assets',
    'Upload assets bulk action button',
    translationKey('Action.DevelopmentItems.UploadAssets', TranslationNamespace.Creations),
  );
  const uploadingLabel = tPendingTranslation(
    'Uploading',
    'Button text when Import is actively uploading',
    translationKey('Action.DevelopmentItems.Uploading', TranslationNamespace.Creations),
  );
  const groupInventoryLabel = tPendingTranslation(
    'Group Inventory',
    'Destination label for a group-owned bulk asset upload.',
    translationKey('Label.BulkUpload.Destination.GroupInventory', TranslationNamespace.Creations),
  );
  const myInventoryLabel = tPendingTranslation(
    'My Inventory',
    'Destination label for a user-owned bulk asset upload.',
    translationKey('Label.BulkUpload.Destination.MyInventory', TranslationNamespace.Creations),
  );
  const inventoryScope = useMemo<InventoryScope | undefined>(() => {
    if (groupId != null) {
      return {
        ownerType: 'groups',
        ownerId: groupId,
        ownerName: groupInventoryLabel,
        groupId,
      };
    }
    if (userId != null) {
      return {
        ownerType: 'users',
        ownerId: userId,
        ownerName: myInventoryLabel,
      };
    }
    return undefined;
  }, [groupId, groupInventoryLabel, myInventoryLabel, userId]);

  const handleOpenImporter = useCallback(() => {
    openImporter(inventoryScope, onUploadComplete);
  }, [inventoryScope, onUploadComplete, openImporter]);

  return (
    <>
      <Button
        variant='Emphasis'
        size='Medium'
        isDisabled={inventoryScope == null}
        onClick={handleOpenImporter}>
        {importInProgress ? (
          <span className='flex items-center gap-small'>
            <ProgressCircle
              variant='Indeterminate'
              size='Small'
              ariaLabel={uploadingLabel}
              aria-hidden
            />
            {uploadingLabel}
          </span>
        ) : (
          uploadAssetLabel
        )}
      </Button>
      <ImportQueue />
    </>
  );
};

export const DevelopmentItemsBulkUpload: FunctionComponent<DevelopmentItemsBulkUploadProps> = (
  props,
) => {
  const { groupId, userId } = props;
  const { permissions } = useCurrentOrganization();
  const inventoryOwnerKey = groupId == null ? `user-${userId ?? 0}` : `group-${groupId}`;
  const persistenceOwner = useMemo<ImportQueuePersistenceOwner | undefined>(
    () =>
      groupId != null
        ? { ownerId: groupId, ownerType: 'groups' }
        : userId != null
          ? { ownerId: userId, ownerType: 'users' }
          : undefined,
    [groupId, userId],
  );

  if (groupId != null && !permissions?.canCreateAssets) {
    return null;
  }

  return (
    <ImportProvider key={inventoryOwnerKey} persistenceOwner={persistenceOwner}>
      <DevelopmentItemsBulkUploadTrigger {...props} />
    </ImportProvider>
  );
};
