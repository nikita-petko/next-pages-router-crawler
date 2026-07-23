import type { FunctionComponent } from 'react';
import React, { useCallback, useState } from 'react';
import { Chip } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import {
  Alert,
  Button,
  CircularProgress,
  Grid,
  makeStyles,
  StickyFooter,
  Typography,
  useMediaQuery,
} from '@rbx/ui';
import TranslationNamespace from '../../constants/TranslationNamespace';
import useCurrentGroup from '../../hooks/useCurrentGroup';
import { useGetGroupInfo } from '../../queries';
import { GroupManagementSurface } from '../../utils/types';
import usePermissions from '../hooks/usePermissions';
import { usePermissionsTranslation } from '../providers/TranslationProvider';
import { usePermissionsUiConfig } from '../providers/UIConfigProvider';
import { canPermissionChange, findUpdatedPermissions } from '../utils/permission';
import {
  ORDERED_PERMISSION_TABS_COMMUNITY,
  ORDERED_PERMISSION_TABS_CREATION,
  PERMISSION_TAB_GROUP_IDS,
  PermissionTab,
} from '../utils/tabConfig';
import type { CreatorDetails, EntityDetails, PermissionRequest } from '../utils/types';
import { CreatorTypes, EntityTypes } from '../utils/types';
import { PermissionGroup } from './PermissionGroup';
import { SaveConfirmationDialog } from './SaveConfirmationDialog';

export type PermissionGroupListProps = {
  entity?: EntityDetails;
  creator?: CreatorDetails;
};

const usePermissionsContainerStyles = makeStyles()((theme) => ({
  rootClass: {
    display: 'grid',
    gap: theme.spacing(2),
  },
  footerButton: {
    margin: `0 ${theme.spacing(1)} 0 0`,
  },
}));

const reloadWindow = () => {
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
};

const DefaultLoadError: FunctionComponent = () => {
  const { translate } = usePermissionsTranslation();
  return (
    <Typography variant='h4'>
      {translate('Organization.Messages.ErrorLoadingPermissions')}
    </Typography>
  );
};

const PermissionGroupList: FunctionComponent<PermissionGroupListProps> = ({ creator, entity }) => {
  const {
    classes: { rootClass, footerButton },
  } = usePermissionsContainerStyles();
  const { showRevokeAllButton, showConfirmationOnSave } = usePermissionsUiConfig();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const { translate, displayMessage } = usePermissionsTranslation();
  const { translateWithNamespace } = useTranslation();
  const { organization, errorComponents, surface, isOrganizationLoading } = useCurrentGroup();

  const {
    isPending,
    isError,
    isSaving,
    metadata,
    permissionData: initialPermissions,
    savePermissions,
  } = usePermissions(creator, entity);

  const showMemberCount =
    entity?.type === EntityTypes.GROUP && creator?.type === CreatorTypes.MEMBER_ROLE;
  const groupInfoQuery = useGetGroupInfo(showMemberCount ? organization?.groupId : undefined);
  const memberCount = showMemberCount ? (groupInfoQuery.data?.memberCount ?? 0) : undefined;

  const [permissionData, setPermissionData] = useState<
    Record<string, PermissionRequest> | undefined
  >(initialPermissions ?? undefined);
  const [trackedInitialPermissions, setTrackedInitialPermissions] = useState(initialPermissions);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [selectedTab, setSelectedTab] = useState<PermissionTab>(PermissionTab.GENERAL);

  const isGroupEntity = entity?.type === EntityTypes.GROUP;

  if (trackedInitialPermissions !== initialPermissions && initialPermissions != null) {
    setTrackedInitialPermissions(initialPermissions);
    setPermissionData(initialPermissions);
  }

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

  const persistPermissions = useCallback(
    (permissionRequest: Record<string, PermissionRequest>) => {
      try {
        savePermissions(permissionRequest);
      } catch {
        displayMessage(translate('Messages.ErrorSavingPermissions'), true);
      }
    },
    [savePermissions, displayMessage, translate],
  );

  const maybePromptAndPersist = useCallback(() => {
    if (!permissionData) {
      displayMessage(translate('Messages.ErrorSavingPermissions'), true);
      return;
    }
    if (showConfirmationOnSave) {
      setShowSaveConfirmation(true);
    } else {
      persistPermissions(permissionData);
    }
  }, [
    displayMessage,
    translate,
    showConfirmationOnSave,
    setShowSaveConfirmation,
    persistPermissions,
    permissionData,
  ]);

  const discardUnsavedChanges = useCallback(() => {
    setPermissionData(initialPermissions ?? undefined);
  }, [initialPermissions, setPermissionData]);

  const closeDialogAndDiscardUnsavedChanges = useCallback(() => {
    setShowSaveConfirmation(false);
    discardUnsavedChanges();
  }, [setShowSaveConfirmation, discardUnsavedChanges]);

  const closeDialogAndPersist = useCallback(() => {
    if (!permissionData) {
      displayMessage(translate('Messages.ErrorSavingPermissions'), true);
      return;
    }
    setShowSaveConfirmation(false);
    persistPermissions(permissionData);
  }, [setShowSaveConfirmation, persistPermissions, permissionData, displayMessage, translate]);

  const revokeAllPermissions = useCallback(() => {
    const newPermissionsData: Record<string, PermissionRequest> = {};

    if (!permissionData || !initialPermissions) {
      displayMessage(translate('Messages.ErrorSavingPermissions'), true);
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
  }, [
    permissionData,
    initialPermissions,
    setPermissionData,
    persistPermissions,
    displayMessage,
    translate,
  ]);

  if (isError) {
    return errorComponents?.loadErrorComponent ? (
      <>{errorComponents.loadErrorComponent({ onReload: reloadWindow })}</>
    ) : (
      <DefaultLoadError />
    );
  }

  if (
    isPending ||
    isOrganizationLoading ||
    !entity ||
    !creator ||
    !metadata ||
    !initialPermissions ||
    !permissionData
  ) {
    return (
      <Grid container justifyContent='center' mt={10}>
        <CircularProgress />
      </Grid>
    );
  }

  const isNoneChecked = Object.keys(permissionData).every(
    (permissionId) =>
      !(
        permissionData[permissionId].isGranted ||
        initialPermissions[permissionId].isInherited === true
      ) || !initialPermissions[permissionId].canEdit,
  );
  const isAnyEditable = Object.values(initialPermissions).some((permission) =>
    canPermissionChange(permission),
  );
  const { selected, unselected } = findUpdatedPermissions(initialPermissions, permissionData);

  const title = translate('Title');
  let info;
  if (entity?.type === EntityTypes.GROUP && creator.type === CreatorTypes.MEMBER_ROLE) {
    info = memberCount
      ? translate(`PermissionGroup.${creator.type}.Info`, [], {
          numMembers: String(memberCount),
        })
      : null;
  } else {
    info = translate(`PermissionGroup.${creator.type}.Info`);
  }
  const revokeAccessLabel = translate('Action.RevokeAccess');
  const cancelActionLabel = translate('Action.Cancel');
  const saveActionLabel = translate('Action.Save');

  const filteredMetadata = isGroupEntity
    ? metadata.filter((group) => PERMISSION_TAB_GROUP_IDS[selectedTab].has(group.groupId))
    : metadata;

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
        <Alert severity='info' variant='standard'>
          {info}
        </Alert>
      )}

      {isGroupEntity && (
        <Grid container justifyContent='left'>
          {(surface === GroupManagementSurface.Community
            ? ORDERED_PERMISSION_TABS_COMMUNITY
            : ORDERED_PERMISSION_TABS_CREATION
          ).map((tab) => (
            <Grid pr={1} key={tab}>
              <Chip
                isChecked={selectedTab === tab}
                text={translateWithNamespace(
                  TranslationNamespace.GroupManagement,
                  `Group.Chip.${tab}.Label`,
                )}
                onCheckedChange={() => setSelectedTab(tab)}
                size='Medium'
                variant='Standard'
                data-testid={`permission-tab-chip-${tab}`}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <ul className='flex flex-col [gap:12px]' style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {filteredMetadata.map((permissionGroup) => (
          <PermissionGroup
            key={permissionGroup.groupId}
            metadata={permissionGroup}
            initialSelections={initialPermissions}
            currentSelections={permissionData}
            onPermissionChange={onPermissionChange}
          />
        ))}
      </ul>
      {isAnyEditable && isMobile && (
        <StickyFooter
          secondary={{
            variant: 'outlined',
            color: 'primary',
            onClick: discardUnsavedChanges,
            disabled: isPending || isSaving || (selected.length === 0 && unselected.length === 0),
            label: typeof cancelActionLabel === 'string' ? cancelActionLabel : '',
          }}
          primary={{
            variant: 'contained',
            loading: isPending || isSaving,
            disabled: selected.length === 0 && unselected.length === 0,
            onClick: maybePromptAndPersist,
            label: typeof saveActionLabel === 'string' ? saveActionLabel : '',
          }}
        />
      )}
      {isAnyEditable && (
        <Grid container>
          <Button
            data-testid='permission-save-button'
            variant='contained'
            size='medium'
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
            size='medium'
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

export { PermissionGroupList };
