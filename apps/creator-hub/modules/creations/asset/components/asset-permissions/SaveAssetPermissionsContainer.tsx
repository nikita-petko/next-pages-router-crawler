import { useRouter } from 'next/router';
import type { FunctionComponent } from 'react';
import React, { useCallback } from 'react';
import type { GrantPermissionError } from '@rbx/client-asset-permissions-api/v1';
import { AssetConsumerAction, ErrorCode, SubjectType } from '@rbx/client-asset-permissions-api/v1';
import { useTranslation } from '@rbx/intl';
import { Grid, Button } from '@rbx/ui';
import assetPermissionsApiClient from '@modules/clients/assetPermissions';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import UseAssetPermissionsStyles from './AssetPermissionsContainer.styles';
import type { TAssetDetails } from './types';

type SaveAssetPermissionsContainerProps = {
  universeId: number;
  pendingAssetIdsList: Map<number, TAssetDetails>;
  onItemsSave: () => void;
  onShowToast: (messages: { isSuccess: boolean; title: string; description?: string }[]) => void;
};

const SaveAssetPermissionsContainer: FunctionComponent<
  React.PropsWithChildren<SaveAssetPermissionsContainerProps>
> = ({ universeId, pendingAssetIdsList, onItemsSave, onShowToast }) => {
  const {
    classes: { actionContainer, buttonText },
  } = UseAssetPermissionsStyles();
  const router = useRouter();
  const { translate } = useTranslation();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { settings } = useSettings(); // Remove with migrateAssetPermissionsParams

  const emitSaveChangesSuccessEvent = useCallback(
    (itemCount: number) => {
      unifiedLogger.logClickEvent({
        eventName: 'clickSaveChanges.experience.permissions.success',
        parameters: {
          count: itemCount.toString(),
        },
      });
    },
    [unifiedLogger],
  );

  const emitSaveChangesFailureEvent = useCallback(
    (itemCount: number) => {
      unifiedLogger.logClickEvent({
        eventName: 'clickSaveChanges.experience.permissions.failure',
        parameters: {
          count: itemCount.toString(),
        },
      });
    },
    [unifiedLogger],
  );

  const handleFormSubmit = useCallback(async () => {
    const toastMessages: { isSuccess: boolean; title: string; description?: string }[] = [];
    const assetIds = Array.from(pendingAssetIdsList.keys());
    try {
      // Grant to dependencies for composites until we have game session store.
      const assetGrantRequests = assetIds.map((assetId) => {
        return {
          assetId,
          grantToDependencies: true,
        };
      });
      // This allows us to check permissions for assets that are not directly granted to the user but may be granted through its parents.
      // Ex: A user purchases a model with dependent meshes. The user should now have use access to those meshes.
      const enableDeepAccessCheck = true;

      const response = await assetPermissionsApiClient.batchGrantAssetPermissions(
        assetIds,
        assetGrantRequests,
        enableDeepAccessCheck,
        SubjectType.Universe,
        universeId.toString(),
        AssetConsumerAction.Use,
        settings.migrateAssetPermissionsParams ?? false,
      );

      const successCount = response.successAssetIds?.length ?? 0;
      if (successCount > 0) {
        toastMessages.push({
          isSuccess: true,
          title: translate('Message.ChangeSaved'),
          description: translate('Message.PermissionGivenAssets', {
            ids: successCount.toString(),
          }),
        });
        emitSaveChangesSuccessEvent(successCount);
      }

      const failureCount = response.errors?.length ?? 0;
      if (failureCount > 0) {
        const publicAssetsError =
          response.errors?.filter(
            (error: GrantPermissionError) =>
              error.code === ErrorCode.PublicAssetCannotBeGrantedTo ||
              error.code === ErrorCode.AssetTypeNotEnabled,
          ) ?? [];
        if (publicAssetsError.length > 0) {
          toastMessages.push({
            isSuccess: false,
            title: translate('Error.PermissionNotSaved'),
            description: translate('Error.PermissionNotNeeded', {
              ids: publicAssetsError.map((error: GrantPermissionError) => error.assetId).join(', '),
            }),
          });
        }

        if (publicAssetsError.length < failureCount) {
          toastMessages.push({
            isSuccess: false,
            title: translate('Error.PermissionNotSaved'),
            description: translate('Error.FieldsNotSaved'),
          });
        }
        emitSaveChangesFailureEvent(failureCount);
      }

      onItemsSave();
    } catch {
      toastMessages.push({
        isSuccess: false,
        title: translate('Error.PermissionNotSaved'),
        description: translate('Error.FieldsNotSaved'),
      });
      emitSaveChangesFailureEvent(assetIds.length);
    } finally {
      onShowToast(toastMessages);
    }
  }, [
    pendingAssetIdsList,
    universeId,
    settings.migrateAssetPermissionsParams,
    onItemsSave,
    translate,
    emitSaveChangesSuccessEvent,
    emitSaveChangesFailureEvent,
    onShowToast,
  ]);

  const handleFormCancel = useCallback(() => {
    router.push(`/dashboard/creations/experiences/${universeId}/overview`);
  }, [router, universeId]);

  return (
    <Grid classes={{ root: actionContainer }} container item>
      <Grid item>
        <Button
          classes={{ root: buttonText }}
          color='primary'
          onClick={handleFormCancel}
          variant='outlined'>
          {translate('Action.Cancel')}
        </Button>
      </Grid>
      <Grid item>
        <Button
          color='primary'
          classes={{ root: buttonText }}
          disabled={pendingAssetIdsList.size === 0}
          onClick={handleFormSubmit}
          variant='contained'>
          {translate('Action.SaveChanges')}
        </Button>
      </Grid>
    </Grid>
  );
};

export default SaveAssetPermissionsContainer;
