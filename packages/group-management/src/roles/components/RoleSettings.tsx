import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo, useState } from 'react';
import { TextArea, TextInput, Button, Icon } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Grid, FormHelperText, DialogTemplate, useDialog, useTheme } from '@rbx/ui';
import type { GroupRoleColorType } from '../../clients/groups';
import type { GroupRoleMetadata } from '../../clients/groups';
import TranslationNamespace from '../../constants/TranslationNamespace';
import useCurrentGroup from '../../hooks/useCurrentGroup';
import { useGetGroupConfigurationMetadata } from '../../queries/rolesQueries';
import {
  DefaultMemberRoleIdNumber,
  DefaultRoleColor,
  DefaultRoleDescriptionMaxLength,
  DefaultRoleMaxRank,
  DefaultRoleMinRank,
  DefaultRoleNameMaxLength,
  GuestRoleRank,
  getColorDotTokens,
  PickableRoleColorsList,
  RoleColorTokenMap,
} from '../../utils/constants';
import { OrganizationsEventName, logOrganizationsEvent } from '../../utils/eventUtils';

export type RoleSettingsProps = {
  role: GroupRoleMetadata;
  onSave: (role: GroupRoleMetadata) => Promise<void>;
  onDelete: (role: GroupRoleMetadata) => void;
  saving?: boolean;
  disabled?: boolean;
};

const RoleSettings: FunctionComponent<React.PropsWithChildren<RoleSettingsProps>> = ({
  role,
  onSave,
  onDelete,
  saving = false,
  disabled = false,
}) => {
  const { translate, translateWithNamespace } = useTranslation();
  const { palette } = useTheme();
  const { organization, permissions, unifiedLogger } = useCurrentGroup();
  const { configure: configureDialog, open: openDialog, close: closeDialog } = useDialog();

  const { data: configMetadata } = useGetGroupConfigurationMetadata();
  const roleConfig = configMetadata?.roleConfiguration;
  const nameMaxLength = roleConfig?.nameMaxLength ?? DefaultRoleNameMaxLength;
  const descriptionMaxLength = roleConfig?.descriptionMaxLength ?? DefaultRoleDescriptionMaxLength;
  const minRank = roleConfig?.minRank ?? DefaultRoleMinRank;
  const maxRank = roleConfig?.maxRank ?? DefaultRoleMaxRank;

  const isGuestRole = role.rank === GuestRoleRank;
  const isBaseMemberRole = role.id === DefaultMemberRoleIdNumber;

  const [name, setName] = useState<string>(role?.name ?? '');
  const [rank, setRank] = useState<number>(role?.rank ?? minRank);
  const [description, setDescription] = useState<string>(role?.description ?? '');
  const [color, setColor] = useState<GroupRoleColorType | null | undefined>(role?.color);

  const hasUnsavedChanges =
    name !== (role?.name ?? '') ||
    rank !== (role?.rank ?? minRank) ||
    description !== (role?.description ?? '') ||
    color !== role?.color;

  const rankErrorMessage = useMemo((): string | undefined => {
    if (isGuestRole || isBaseMemberRole) {
      return undefined;
    }
    if (Number.isNaN(rank)) {
      return translateWithNamespace(TranslationNamespace.GroupManagement, 'Error.RankFieldEmpty');
    }
    if (rank < minRank || rank > maxRank) {
      return translateWithNamespace(TranslationNamespace.GroupManagement, 'Error.RankFieldInvalid');
    }
    if (rank === minRank) {
      return translateWithNamespace(
        TranslationNamespace.Groups,
        'Message.RankReservedOnlyForGuest',
        {
          minRankPlusOne: String(minRank + 1),
          minRank: String(minRank),
          maxRank: String(maxRank),
        },
      );
    }
    return undefined;
  }, [isGuestRole, isBaseMemberRole, rank, minRank, maxRank, translateWithNamespace]);

  const rankHasError = rankErrorMessage !== undefined;

  const handleCancel = useCallback(() => {
    setName(role?.name ?? '');
    setColor(role?.color);
    setDescription(role?.description ?? '');
    setRank(role?.rank ?? DefaultRoleMinRank);
  }, [role]);

  const handleSave = useCallback(async () => {
    if (!name?.trim() || color === undefined || color === null || !hasUnsavedChanges) {
      return;
    }

    const newMetadata: GroupRoleMetadata = {
      ...role,
      name,
      color,
      description,
      rank,
    };

    await onSave(newMetadata);

    logOrganizationsEvent(unifiedLogger, OrganizationsEventName.ClickOrgsUpdateRoleSettings, {
      group_id: organization?.groupId ?? '',
      role_id: role?.id?.toString() ?? '',
    });
  }, [
    role,
    name,
    color,
    description,
    rank,
    onSave,
    unifiedLogger,
    organization,
    hasUnsavedChanges,
  ]);

  const handleSelectColor = useCallback(
    (newColor: GroupRoleColorType) => {
      if (disabled || saving) {
        return;
      }
      setColor(newColor);
    },
    [setColor, disabled, saving],
  );

  const onNameChanged = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  }, []);

  const onRankChanged = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = Number(e.target.value);
    if (!Number.isNaN(numericValue)) {
      setRank(numericValue);
    }
  }, []);

  const onDescriptionChanged = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  }, []);

  const handleCancelDialog = useCallback(() => {
    closeDialog();
  }, [closeDialog]);

  const handleConfirmDialog = useCallback(() => {
    onDelete(role);
    closeDialog();
  }, [closeDialog, onDelete, role]);

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
  }, [handleCancelDialog, handleConfirmDialog, translate, role]);

  const handleOpenDialog = useCallback(() => {
    configureDialog(confirmRemoveUserDialog);
    openDialog();
  }, [configureDialog, openDialog, confirmRemoveUserDialog]);

  const isSaveButtonDisabled = !name.trim() || rankHasError || isGuestRole || !hasUnsavedChanges;

  const showDeleteRole =
    (permissions?.isOwner === true || permissions?.canDeleteRoles === true) &&
    !isBaseMemberRole &&
    !isGuestRole;

  return (
    <Grid
      container
      direction='row'
      alignContent='flex-start'
      wrap='wrap'
      className='padding-top-large padding-bottom-large'
      gap={3}>
      <Grid container item XSmall={12}>
        <div className='padding-bottom-large width-full'>
          <TextInput
            label={translateWithNamespace(TranslationNamespace.GroupManagement, 'Label.RoleName')}
            maxLength={nameMaxLength}
            value={name}
            isDisabled={disabled || saving || isGuestRole}
            onChange={onNameChanged}
          />
          <span className='block text-caption-medium text-align-x-end'>
            {name.length}/{nameMaxLength}
          </span>
        </div>
        <div className='width-full'>
          <TextArea
            label={translateWithNamespace(TranslationNamespace.Groups, 'Heading.Description')}
            textareaStyle={{ resize: 'vertical', minHeight: '150px' }}
            maxLength={descriptionMaxLength}
            value={description}
            isDisabled={disabled || saving || isGuestRole}
            onChange={onDescriptionChanged}
          />
          <span className='block text-caption-medium text-align-x-end'>
            {description.length}/{descriptionMaxLength}
          </span>
        </div>
      </Grid>
      {!isBaseMemberRole && !isGuestRole && (
        <Grid container item XSmall={12} wrap='wrap'>
          <div className='block text-title-large padding-bottom-small'>
            {translateWithNamespace(TranslationNamespace.GroupManagement, 'Label.RoleColor')}
          </div>
          <Grid container item XSmall={12} wrap='wrap'>
            <Grid container className='wrap gap-medium' style={{ maxWidth: 340 }}>
              {PickableRoleColorsList.map((roleColorType) => {
                const tokens = RoleColorTokenMap[roleColorType];
                const bgToken = getColorDotTokens(roleColorType, color, palette.mode);
                const colorName = translateWithNamespace(
                  TranslationNamespace.GroupManagement,
                  tokens.translationKey,
                );
                return (
                  <button
                    key={roleColorType}
                    type='button'
                    data-role-color={roleColorType}
                    className={`flex radius-circle outline-none padding-none${!disabled && !saving ? ' cursor-pointer' : ''}`}
                    style={{
                      width: 32,
                      height: 32,
                      border: 'none',
                      background: `var(--${bgToken})`,
                    }}
                    aria-label={colorName}
                    title={colorName}
                    onClick={() => handleSelectColor(roleColorType)}>
                    {color === roleColorType && roleColorType !== DefaultRoleColor && (
                      <Icon
                        name='icon-filled-check'
                        size='Medium'
                        className='margin-auto content-emphasis'
                      />
                    )}
                    {roleColorType === DefaultRoleColor && (
                      <Icon
                        name='icon-filled-circle-slash'
                        size='Medium'
                        className={`margin-auto ${color === roleColorType ? 'content-action-sub-emphasis' : 'content-emphasis'}`}
                      />
                    )}
                  </button>
                );
              })}
            </Grid>
          </Grid>
        </Grid>
      )}
      <div className='padding-bottom-large width-full'>
        <TextInput
          label={`${translateWithNamespace(TranslationNamespace.Groups, 'Heading.Rank')} (${minRank}-${maxRank})`}
          type='number'
          min={minRank}
          max={maxRank}
          value={rank.toString()}
          isDisabled={disabled || saving || isGuestRole || isBaseMemberRole}
          hasError={rankHasError}
          onChange={onRankChanged}
          helperText={
            rankErrorMessage ??
            translateWithNamespace(TranslationNamespace.GroupManagement, 'Subtext.Rank')
          }
        />
      </div>
      {!disabled && (
        <Grid container item XSmall={12} className='flex-row' gap={1}>
          <Button
            variant='Emphasis'
            size='Medium'
            isDisabled={isSaveButtonDisabled}
            onClick={handleSave}
            isLoading={saving}>
            {translateWithNamespace(TranslationNamespace.GroupManagement, 'Action.Save')}
          </Button>
          <Button
            variant='Standard'
            size='Medium'
            onClick={handleCancel}
            isDisabled={saving || !hasUnsavedChanges}>
            {translateWithNamespace(TranslationNamespace.GroupManagement, 'Action.Cancel')}
          </Button>
          {showDeleteRole && (
            <Button
              variant='Alert'
              size='Medium'
              aria-label='delete-role'
              isDisabled={disabled || saving}
              onClick={handleOpenDialog}>
              {translateWithNamespace(TranslationNamespace.GroupManagement, 'Action.DeleteRole')}
            </Button>
          )}

          {isGuestRole && (
            <FormHelperText className='width-full margin-top-small text-caption-medium content-system-alert'>
              {translateWithNamespace(
                TranslationNamespace.GroupManagement,
                'Message.ModifyGuestRole',
              )}
            </FormHelperText>
          )}
        </Grid>
      )}
    </Grid>
  );
};

export default RoleSettings;
