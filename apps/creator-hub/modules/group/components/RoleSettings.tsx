import React, {
  Fragment,
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Grid,
  makeStyles,
  Button,
  TextField,
  Typography,
  CheckIcon,
  Divider,
  FormHelperText,
  DeleteIcon,
  DialogTemplate,
  useDialog,
} from '@rbx/ui';
import { RoleColorType, RoleMetadata } from '@rbx/clients/organizationsServiceApi';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { useThemeMode } from '@rbx/settings';
import { getRoleStyle } from '../utils/groupUtils';
import useCurrentOrganization from '../hooks/useCurrentOrganization';
import { DefaultMemberRoleId, SupportedRoleColorTypes } from '../constants/groupConstants';
import { OrganizationsEventName, logOrganizationsEvent } from '../utils/eventUtils';

const useRoleSettingsStyles = makeStyles()((theme) => ({
  container: {
    marginTop: 40,
    '& > *:not(:last-child)': {
      paddingBottom: 40,
    },
  },

  title: {
    paddingBottom: 24,
  },

  buttonContainer: {
    flexDirection: 'row',
  },

  saveButton: {
    margin: '0 12px',
  },

  colorGrid: {
    maxWidth: 448,
    '& > *:not(:last-child)': {
      margin: '0px 24px 24px 0px',
    },
  },

  colorButton: {
    width: 32,
    height: 32,
    borderRadius: 32,
    display: 'flex',
  },

  checkIcon: {
    margin: 'auto',
    color: theme.palette.common.black,
  },

  divider: {
    marginBottom: 24,
    color: theme.palette.components.divider,
    width: '100%',
  },

  errorMessageStyles: {
    width: '100%',
    marginTop: 8,
    color: theme.palette.actionV2.important.fill,
    fontWeight: 'bold',
    fontSize: 12,
  },

  deleteButton: {
    textTransform: 'none',
    textColor: theme.palette.actionV2.important.fill,
    '& > *:not(:first-child)': {
      marginLeft: 4,
    },
  },

  cursorPointer: {
    cursor: 'pointer',
  },
}));

export type RoleSettingsProps = {
  role: RoleMetadata;
  onSave: (role: RoleMetadata, autoSelectTab: boolean) => Promise<void>;
  onDelete: (role: RoleMetadata) => Promise<void>;
  saving?: boolean;
  disabled?: boolean;
  isMobile?: boolean;
};

const RoleSettings: FunctionComponent<React.PropsWithChildren<RoleSettingsProps>> = ({
  role,
  onSave,
  onDelete,
  saving = false,
  disabled = false,
  isMobile = false,
}) => {
  const { translate } = useTranslation();
  const { themeMode } = useThemeMode();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { organization, permissions } = useCurrentOrganization();
  const { configure: configureDialog, open: openDialog, close: closeDialog } = useDialog();

  const {
    classes: {
      container,
      title,
      buttonContainer,
      saveButton,
      colorGrid,
      colorButton,
      checkIcon,
      divider,
      errorMessageStyles,
      deleteButton,
      cursorPointer,
    },
    cx,
  } = useRoleSettingsStyles();

  const [name, setName] = useState<string | null | undefined>(role?.name);
  const [color, setColor] = useState<RoleColorType | null | undefined>(role?.color);

  const handleCancel = useCallback(() => {
    setName(role?.name);
    setColor(role?.color);
  }, [role, setName, setColor]);

  const handleSave = useCallback(async () => {
    if (!name || !color) return;

    const newMetadata = {
      ...role,
      name,
      color,
    };

    await onSave(newMetadata, isMobile);

    logOrganizationsEvent(unifiedLogger, OrganizationsEventName.ClickOrgsUpdateRoleSettings, {
      group_id: organization?.groupId ?? '',
      role_id: role?.id?.toString() ?? '',
    });
  }, [role, name, color, onSave, unifiedLogger, organization, isMobile]);

  const handleDeleteRole = useCallback(async () => {
    await onDelete(role);
  }, [role, onDelete]);

  const handleSelectColor = useCallback(
    (newColor: string) => {
      if (disabled || saving) return;

      setColor(RoleColorType[newColor as keyof typeof RoleColorType]);
    },
    [setColor, disabled, saving],
  );

  useEffect(() => {
    setName(role?.name);
    setColor(role?.color);
  }, [role]);

  const handleCancelDialog = useCallback(() => {
    closeDialog();
  }, [closeDialog]);

  const handleConfirmDialog = useCallback(() => {
    handleDeleteRole();
    logOrganizationsEvent(unifiedLogger, OrganizationsEventName.ClickOrgsDeleteRole, {
      group_id: organization?.groupId ?? '',
      role_id: role?.id?.toString() ?? '',
    });
    closeDialog();
    /* eslint-disable-next-line react-hooks/exhaustive-deps --  NOTE
(jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
responsible for triaging issue. */
  }, [closeDialog, handleDeleteRole, role, organization, unifiedLogger]);

  const confirmRemoveUserDialog = useMemo(() => {
    return (
      <DialogTemplate
        variant='alert'
        color='destructive'
        title={translate('Action.DeleteRole')}
        content={translate('Message.DeleteRole', {
          roleName: role.name ?? '',
        })}
        cancelText={translate('Action.Cancel')}
        confirmText={translate('Action.Delete')}
        onCancel={handleCancelDialog}
        onConfirm={handleConfirmDialog}
      />
    );
    /* eslint-disable-next-line react-hooks/exhaustive-deps --  NOTE
(jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
responsible for triaging issue. */
  }, [handleCancelDialog, handleConfirmDialog, translate]);

  const handleOpenDialog = useCallback(() => {
    configureDialog(confirmRemoveUserDialog);
    openDialog();
  }, [configureDialog, openDialog, confirmRemoveUserDialog]);

  return (
    <Grid container direction='row' alignContent='flex-start' wrap='wrap' className={container}>
      <Grid container item XSmall={12}>
        <Typography variant='h5' className={title}>
          {translate('Label.RoleName')}
        </Typography>
        <TextField
          value={name ?? ''}
          fullWidth
          required
          id='name'
          inputProps={{ maxLength: 32 }}
          label={translate('Label.EditRole')}
          helperText={translate('Message.CharacterLimit', {
            limit: '32',
          })}
          // Default role cannot be renamed
          disabled={disabled || saving || role.id === DefaultMemberRoleId}
          onChange={(e) => setName(e.target.value)}
        />
      </Grid>
      <Grid container item XSmall={12} wrap='wrap'>
        <Typography variant='h5' className={title}>
          {translate('Label.RoleColor')}
        </Typography>
        <Grid container item XSmall={12} wrap='wrap'>
          <Grid container className={colorGrid}>
            {SupportedRoleColorTypes.map((roleColorType) => (
              <div
                aria-label={`${roleColorType}`}
                role='button'
                key={roleColorType}
                className={cx(colorButton, { [cursorPointer]: !disabled && !saving })}
                style={getRoleStyle(
                  RoleColorType[roleColorType as keyof typeof RoleColorType],
                  themeMode,
                  'background',
                )}
                onClick={() => handleSelectColor(roleColorType)}
                tabIndex={0}
                onKeyPress={() => handleSelectColor(roleColorType)}>
                {color === roleColorType && <CheckIcon className={checkIcon} />}
              </div>
            ))}
          </Grid>
        </Grid>
      </Grid>
      {/* Only show cancel/save/delete buttons if settings component is enabled */}
      {!disabled && (
        <Fragment>
          <Grid container item XSmall={12} className={buttonContainer}>
            <Divider className={divider} />
            <Button
              variant='outlined'
              color='primary'
              size='large'
              onClick={handleCancel}
              disabled={saving || (role.name === name && role.color === color)}>
              {translate('Action.Cancel')}
            </Button>
            <Button
              className={saveButton}
              variant='contained'
              size='large'
              disabled={
                !color || !name || name.length === 0 || (role.name === name && role.color === color)
              }
              onClick={handleSave}
              loading={saving}>
              {translate('Action.SaveChanges')}
            </Button>

            {role.id === DefaultMemberRoleId && (
              <FormHelperText className={errorMessageStyles}>
                {translate('Message.ModifyDefaultRole')}
              </FormHelperText>
            )}
          </Grid>

          {/* Default role cannot be deleted */}
          {(permissions?.isOwner || permissions?.canDeleteRoles === true) &&
            role.id !== DefaultMemberRoleId && (
              <Button
                color='destructive'
                aria-label='delete-role'
                size='medium'
                className={deleteButton}
                disabled={disabled || saving}
                onClick={handleOpenDialog}>
                <DeleteIcon color={disabled || saving ? 'disabled' : 'error'} />
                {translate('Action.DeleteRole')}
              </Button>
            )}
        </Fragment>
      )}
    </Grid>
  );
};

export default RoleSettings;
