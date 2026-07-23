import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid,
  makeStyles,
  StickyFooter,
  Typography,
  useMediaQuery,
} from '@rbx/ui';
import { useRouter } from 'next/router';
import LoadError from '@modules/miscellaneous/error/LoadError';
import { groupsClient } from '@modules/clients';
import { IXPLayers, TalentHubParameters } from '@modules/clients/ixpExperiments';
import useCurrentOrganization from '@modules/group/hooks/useCurrentOrganization';
import useIXPParameters from '@modules/miscellaneous/hooks/useIXPParameters';
import { FeatureFlagName, useSettings } from '@modules/settings';
import { PermissionGroup } from './PermissionGroup';
import usePermissions from '../hooks/usePermissions';
import { useTranslationContext } from '../providers/TranslationProvider';
import { useUiConfig } from '../providers/UIConfigProvider';
import { CreatorDetails, EntityDetails, PermissionRequest } from '../utils/types';
import { canPermissionChange, findUpdatedPermissions } from '../utils/permission';
import { SaveConfirmationDialog } from './SaveConfirmationDialog';
import { CreatorTypes, EntityTypes } from '../utils/enums';

type PermissionGroupListProps = {
  entity?: EntityDetails;
  creator?: CreatorDetails;
};

const usePermissionsContainerStyles = makeStyles()((theme) => ({
  rootClass: {
    margin: `0 ${theme.spacing(3)}`,
  },
  footerActionContainer: {
    margin: `${theme.spacing(4)} 0`,
  },
  footerButton: {
    margin: `0 ${theme.spacing(1)} 0 0`,
  },
  permissionGroupList: {
    listStyle: 'none',
    padding: 0,
  },
  checkboxSubtext: {
    paddingLeft: theme.spacing(4),
  },
  grantAllSeparator: {
    margin: `${theme.spacing(2)} 0`,
  },
  informationMessage: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(3),
  },
}));

const PermissionGroupList: FunctionComponent<PermissionGroupListProps> = ({ creator, entity }) => {
  const {
    classes: {
      permissionGroupList,
      checkboxSubtext,
      rootClass,
      footerActionContainer,
      footerButton,
      informationMessage,
      grantAllSeparator,
    },
  } = usePermissionsContainerStyles();
  const router = useRouter();
  const { showRevokeAllButton, showConfirmationOnSave } = useUiConfig();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const { translate, displayMessage } = useTranslationContext();
  const { organization } = useCurrentOrganization();
  const { settings } = useSettings();
  const { params: ixpParams } = useIXPParameters(IXPLayers.TalentHub, {
    restoreInitialValueFromCache: true,
  });
  const ixpValue = ixpParams[TalentHubParameters.EnableTalentHubV2];
  const isTH2Enabled =
    !!settings?.[FeatureFlagName.enableTalentHubV2] || ixpValue === 1 || ixpValue === true;

  const {
    isPending,
    isError,
    isSaving,
    metadata,
    permissionData: initialPermissions,
    savePermissions,
  } = usePermissions(creator, entity);

  const [permissionData, setPermissionData] = useState<
    Record<string, PermissionRequest> | undefined
  >();
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [memberCount, setMemberCount] = useState<number | undefined>();

  useEffect(() => {
    if (initialPermissions) {
      setPermissionData(initialPermissions);
    }
  }, [initialPermissions]);

  useEffect(() => {
    async function fetchMemberCount() {
      const groupInfo = await groupsClient.getGroupInfo(Number(organization?.groupId));
      setMemberCount(groupInfo.memberCount ?? 0);
    }
    if (entity?.type === EntityTypes.ORGANIZATION && creator?.type === CreatorTypes.MEMBER_ROLE) {
      fetchMemberCount();
    }
  }, [entity?.type, creator?.type, organization]);

  const onPermissionChange = useCallback(
    (permissionId: string, isGranted: boolean) => {
      setPermissionData((prevPermissionData) => {
        const newPermissions: Record<string, PermissionRequest> = {};
        metadata?.forEach((permissionGroup) => {
          permissionGroup.permissions.forEach((permission) => {
            if (!prevPermissionData?.[permission.permissionId]) {
              return;
            }
            if (permission.permissionId === permissionId) {
              newPermissions[permission.permissionId] = { isGranted };
            } else if (
              isGranted &&
              permission.inheritsFrom &&
              initialPermissions?.[permissionId]?.canEdit &&
              permission.inheritsFrom.includes(permissionId)
            ) {
              newPermissions[permission.permissionId] = { isGranted };
            } else {
              newPermissions[permission.permissionId] = prevPermissionData[permission.permissionId];
            }
          });
        });
        return newPermissions;
      });
    },
    [setPermissionData, initialPermissions, metadata],
  );

  const handleSelectAllCheckboxChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const isGranted = event.target.checked;
      const newPermissionsData: Record<string, PermissionRequest> = {};

      if (!permissionData || !initialPermissions) {
        displayMessage('Messages.ErrorSavingPermissions');
        return;
      }

      Object.keys(permissionData).forEach((permissionId) => {
        if (canPermissionChange(initialPermissions[permissionId])) {
          newPermissionsData[permissionId] = { isGranted };
        } else {
          newPermissionsData[permissionId] = permissionData[permissionId];
        }
      });
      setPermissionData(newPermissionsData);
    },
    [displayMessage, permissionData, initialPermissions, setPermissionData],
  );

  const persistPermissions = useCallback(
    async (permissionRequest: Record<string, PermissionRequest>) => {
      try {
        await savePermissions(permissionRequest);
        displayMessage('Messages.PermissionsSaved');
      } catch {
        displayMessage('Messages.ErrorSavingPermissions');
      }
    },
    [savePermissions, displayMessage],
  );

  const maybePromptAndPersist = useCallback(async () => {
    if (showConfirmationOnSave) {
      setShowSaveConfirmation(true);
    } else {
      persistPermissions(permissionData!);
    }
  }, [showConfirmationOnSave, setShowSaveConfirmation, persistPermissions, permissionData]);

  const discardUnsavedChanges = useCallback(() => {
    setPermissionData(initialPermissions);
  }, [initialPermissions, setPermissionData]);

  const closeDialogAndDiscardUnsavedChanges = useCallback(() => {
    setShowSaveConfirmation(false);
    discardUnsavedChanges();
  }, [setShowSaveConfirmation, discardUnsavedChanges]);

  const closeDialogAndPersist = useCallback(async () => {
    setShowSaveConfirmation(false);
    // permissionData cannot be null here
    persistPermissions(permissionData!);
  }, [setShowSaveConfirmation, persistPermissions, permissionData]);

  const revokeAllPermissions = useCallback(() => {
    const newPermissionsData: Record<string, PermissionRequest> = {};

    if (!permissionData || !initialPermissions) {
      displayMessage('Messages.ErrorSavingPermissions');
      return;
    }

    Object.keys(permissionData).forEach((permissionId) => {
      if (canPermissionChange(initialPermissions[permissionId])) {
        newPermissionsData[permissionId] = { isGranted: false };
      } else {
        newPermissionsData[permissionId] = permissionData[permissionId];
      }
    });
    setPermissionData(newPermissionsData);
    persistPermissions(newPermissionsData);
  }, [permissionData, initialPermissions, setPermissionData, persistPermissions, displayMessage]);

  if (isPending || !entity || !creator) {
    return (
      <Grid container justifyContent='center' mt={10}>
        <CircularProgress />
      </Grid>
    );
  }

  if (!permissionData && initialPermissions) {
    // permissionData will be set in next re-render, so we skip building the component here.
    return null;
  }

  if (isError || !metadata || !permissionData || !initialPermissions) {
    return <LoadError onReload={() => router.reload()} />;
  }

  const areAllChecked = Object.keys(permissionData).every(
    (permissionId) =>
      permissionData[permissionId].isGranted ||
      initialPermissions[permissionId].isInherited ||
      !initialPermissions[permissionId].canEdit,
  );
  const isNoneChecked = Object.keys(permissionData).every(
    (permissionId) =>
      !(permissionData[permissionId].isGranted || initialPermissions[permissionId].isInherited) ||
      !initialPermissions[permissionId].canEdit,
  );
  const isAnyEditable = Object.values(initialPermissions).some((permission) =>
    canPermissionChange(permission),
  );
  const { selected, unselected } = findUpdatedPermissions(initialPermissions, permissionData);

  const title = translate('Title');
  let info;
  if (entity?.type === EntityTypes.ORGANIZATION && creator.type === CreatorTypes.MEMBER_ROLE) {
    info = memberCount
      ? translate(`PermissionGroup.${creator.type}.InfoV2`, [], {
          numMembers: String(memberCount),
        })
      : null;
  } else {
    info = translate(`PermissionGroup.${creator.type}.Info`);
  }
  const revokeAccessLabel = translate('Action.RevokeAccess');

  return (
    <Grid className={rootClass} data-testid='permission-group-list'>
      <Grid
        container
        wrap='nowrap'
        justifyContent={title ? 'space-between' : 'flex-end'}
        alignItems='center'>
        {title && (
          <Typography component='h2' variant='h2' marginBottom={2} marginTop={2}>
            {title}
          </Typography>
        )}
        {showRevokeAllButton && isAnyEditable && revokeAccessLabel && (
          <Button
            variant='text'
            color='primary'
            size='small'
            onClick={revokeAllPermissions}
            disabled={isNoneChecked}
            data-testid='permission-revoke-button'>
            {revokeAccessLabel}
          </Button>
        )}
      </Grid>
      {info && (
        <Alert severity='info' variant='standard' className={informationMessage}>
          {info}
        </Alert>
      )}

      <ul className={permissionGroupList}>
        {metadata.map((permissionGroup) => {
          const filtered = isTH2Enabled
            ? permissionGroup
            : {
                ...permissionGroup,
                permissions: permissionGroup.permissions.filter(
                  (p) => p.permissionId !== 'Organization.TalentHubManager',
                ),
              };
          return (
            <PermissionGroup
              key={filtered.groupId}
              metadata={filtered}
              initialSelections={initialPermissions}
              currentSelections={permissionData}
              onPermissionChange={onPermissionChange}
            />
          );
        })}
        {isAnyEditable && (
          <li>
            <Divider className={grantAllSeparator} />
            <FormControlLabel
              control={
                <Checkbox
                  color='secondary'
                  size='medium'
                  checked={areAllChecked}
                  onChange={handleSelectAllCheckboxChange}
                />
              }
              label={<Typography variant='h6'>{translate('GrantAll.Label')}</Typography>}
            />
            <Grid container>
              <Typography variant='caption' color='secondary' className={checkboxSubtext}>
                {translate('GrantAll.Subtext')}
              </Typography>
            </Grid>
          </li>
        )}
      </ul>
      {isAnyEditable && isMobile && (
        <StickyFooter
          secondary={{
            variant: 'outlined',
            color: 'primary',
            onClick: discardUnsavedChanges,
            disabled: isPending || isSaving || (selected.length === 0 && unselected.length === 0),
            label: String(translate(`Action.Cancel`)),
          }}
          primary={{
            variant: 'contained',
            loading: isPending || isSaving,
            disabled: selected.length === 0 && unselected.length === 0,
            onClick: maybePromptAndPersist,
            label: String(translate('Action.Save')),
          }}
        />
      )}
      {isAnyEditable && (
        <Grid container className={footerActionContainer}>
          <Button
            data-testid='permission-save-button'
            variant='contained'
            size='large'
            loading={isPending || isSaving}
            disabled={selected.length === 0 && unselected.length === 0}
            onClick={maybePromptAndPersist}
            className={footerButton}>
            {translate('Action.Save')}
          </Button>
          <Button
            data-testid='permission-cancel-button'
            variant='outlined'
            color='primary'
            size='large'
            disabled={isPending || isSaving || (selected.length === 0 && unselected.length === 0)}
            onClick={discardUnsavedChanges}
            className={footerButton}>
            {translate('Action.Cancel')}
          </Button>
        </Grid>
      )}
      {showConfirmationOnSave && (
        <SaveConfirmationDialog
          isOpen={showSaveConfirmation}
          grantedList={selected}
          revokedList={unselected}
          onCancel={closeDialogAndDiscardUnsavedChanges}
          onConfirm={closeDialogAndPersist}
        />
      )}
    </Grid>
  );
};

export { PermissionGroupList, type PermissionGroupListProps };
