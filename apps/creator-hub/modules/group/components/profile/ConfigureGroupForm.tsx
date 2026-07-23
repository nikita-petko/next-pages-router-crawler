import React, { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Typography,
  Grid,
  makeStyles,
  useSnackbar,
  Button,
  Divider,
  FormHelperText,
  TextField,
  Alert,
  LaunchIcon,
  RobuxIcon,
  AlertTitle,
  FormControlLabel,
  Label,
  Switch,
} from '@rbx/ui';

import { tryParseResponseError, groupsClient, GroupSocialLink, User } from '@modules/clients';
import { FormMode, toastDurationTime, utils } from '@modules/miscellaneous/common';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { useForm, SubmitHandler, Controller, ControllerRenderProps } from 'react-hook-form';
import { useUpdateGroupAssetPrivacyDefault } from '@modules/react-query/assetPermissions';
import AssetPrivacyInfographic from '@modules/asset-privacy/components/AssetPrivacyInfographic';
import SocialLinkAgeVerificationUpsellBanner from '@modules/social-links/SocialLinkAgeVerificationUpsellBanner';
import useSocialLinksBehavior from '@modules/social-links/hooks/useSocialLinksBehavior';
import { getSocialLinksUpsellCopy } from '@modules/social-links/utils/socialLinksVerificationUtils';
import GroupFeaturesStatus from '../moderation/GroupFeaturesStatus';
import { ConfigureGroupFormType, GroupConfiguration, GroupIcon } from '../../ConfigureGroupTypes';
import IconUploader from '../IconUploader';
import SocialLinksTable from '../SocialLinksTable';
import { validateGroupSocialLink } from '../../utils/groupUtils';
import GroupErrorCodes from '../../interface/GroupErrorCodes';
import { GroupNameChangeCost } from '../../constants/groupConstants';
import { OrganizationsEventName, logOrganizationsEvent } from '../../utils/eventUtils';
import useCurrentOrganization from '../../hooks/useCurrentOrganization';
import ConfigureGroupFormDialog, {
  FieldRequiringConfirmation,
  fieldsRequiringConfirmation,
} from './ConfigureGroupFormDialog';
import OwnershipSection from './OwnershipSection';

const useConfigureGroupFormStyles = makeStyles()((theme) => ({
  betaLabel: {
    alignSelf: 'center',
    height: 20,
    padding: '8px 8px',
    marginLeft: 10,
  },

  configureButton: {
    margin: '0 12px',
    [theme.breakpoints.down('Large')]: {
      margin: '12px 0',
    },
  },

  dialogButton: {
    padding: '0 4px',
  },

  pageContainer: {
    width: '100%',
    height: '100%',
    minHeight: 450,
  },

  formContainer: {
    width: '100%',
    '& > *:not(:last-child)': {
      paddingBottom: 48,
    },
    [theme.breakpoints.down('Large')]: {
      paddingLeft: 12,
      paddingRight: 12,
    },
  },

  inputFormPadding: {
    width: '100%',
    '& > *:not(:last-child)': {
      paddingBottom: 32,
    },
  },

  innerSectionPadding: {
    width: '100%',
    '& > *:not(:last-child)': {
      paddingBottom: 8,
    },
  },

  errorMessageStyles: {
    width: '100%',
    marginTop: 4,
    paddingLeft: 14,
    paddingRight: 14,
    color: theme.palette.actionV2.important.fill,
    fontWeight: 'bold',
    fontSize: 12,
  },

  buttonContainer: {
    padding: '32px 0',
    flexDirection: 'row',
    [theme.breakpoints.down('Large')]: {
      flexDirection: 'column',
    },
  },

  alertContainer: {
    marginTop: 8,
  },

  descriptionField: {
    '& > * > div': {
      minHeight: 180,
      alignItems: 'baseline',
    },
  },

  priceIcon: {
    verticalAlign: 'sub',
    fontSize: '1rem',
  },

  alertTitle: {
    marginBottom: 8,
  },
}));

const { getEnumKeyByValue } = utils;
const ConfigureGroupRegisterOptions = {
  name: {
    required: 'Error.OrganizationNameRequired',
    maxLength: 50,
  },
};

export type ConfigureGroupFormProps = {
  groupConfiguration: GroupConfiguration;
  refreshGroupConfiguration: () => Promise<void>;
  isGroupConfigurationReady: boolean;
  enableCreatorPrivacySettings: boolean;
  disabled?: boolean;
};

const ConfigureGroupForm: FunctionComponent<React.PropsWithChildren<ConfigureGroupFormProps>> = ({
  groupConfiguration,
  refreshGroupConfiguration,
  isGroupConfigurationReady,
  enableCreatorPrivacySettings,
  disabled = false,
}) => {
  const {
    classes: {
      betaLabel,
      dialogButton,
      formContainer,
      inputFormPadding,
      innerSectionPadding,
      configureButton,
      errorMessageStyles,
      buttonContainer,
      alertContainer,
      descriptionField,
      priceIcon,
      alertTitle,
    },
  } = useConfigureGroupFormStyles();

  const { translate } = useTranslation();
  const { enqueue, close } = useSnackbar();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { refreshPermission, permissions } = useCurrentOrganization();

  const { title: ageVerificationUpsellTitle, description: ageVerificationUpsellDescription } =
    getSocialLinksUpsellCopy(
      groupConfiguration.groupSocialLinksAgeVerificationStatus,
      'community',
      permissions?.isOwner ?? false,
    );

  const {
    data: { shouldHideSocialLinksSection, shouldDisableSocialLinkCreation },
  } = useSocialLinksBehavior();

  const [formSubmissionErrorMsg, setFormSubmissionErrorMsg] = useState<string | null>(null);
  const [hasError, setHasError] = useState<boolean>(false);
  const [transferRecipient, setTransferRecipient] = useState<User | undefined>();
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState<boolean>(false);
  const [isAssetPrivacyInfographicOpen, setIsAssetPrivacyInfographicOpen] = useState(false);

  const { mutateAsync: updateAssetPrivacyDefault } = useUpdateGroupAssetPrivacyDefault();

  const configureGroupFormDefaultValue = useMemo(
    () => ({
      icon: groupConfiguration.icon,
      name: groupConfiguration.name,
      description: groupConfiguration.description,
      socialLinks: groupConfiguration.socialLinks,
      owner: groupConfiguration.owner,
      assetPrivacyDefaultRestricted: groupConfiguration.assetPrivacyDefaultRestricted,
    }),
    [groupConfiguration],
  );

  const { getValues, handleSubmit, control, setValue, formState, reset, resetField } =
    useForm<ConfigureGroupFormType>({
      mode: FormMode.OnChange,
      reValidateMode: FormMode.OnChange,
      defaultValues: configureGroupFormDefaultValue,
      shouldUnregister: true,
    });
  const { isSubmitting, errors, isValid, isValidating, isDirty, dirtyFields } = formState;

  // Would use memo here, but the dirtyFields object seems to be modified in place, so it can't be used as a dependency
  const dirtyFieldsRequiringConfirmation = fieldsRequiringConfirmation.filter((field) => {
    if (field === FieldRequiringConfirmation.ASSET_PRIVACY_DEFAULT_RESTRICTED) {
      // The user only needs to confirm if they're opting out
      return dirtyFields[field] && getValues(field) === false;
    }
    // For all other fields, just check if they are dirty
    return dirtyFields[field];
  });

  const handleFormCancel = useCallback(() => {
    if (reset) {
      reset(configureGroupFormDefaultValue);
    }
  }, [configureGroupFormDefaultValue, reset]);

  const handleCancelDialog = useCallback(() => {
    fieldsRequiringConfirmation.forEach((field) => {
      resetField(field);
    });
    setConfirmationDialogOpen(false);
  }, [resetField]);

  const showBottomToast = useCallback(
    (msg: string) => {
      enqueue({
        message: msg,
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
        autoHideDuration: toastDurationTime,
        autoHide: true,
        onClose: close,
      });
    },
    [enqueue, close],
  );

  const handleIconChange = useCallback(
    (newValue: GroupIcon, fieldOnChange: ControllerRenderProps['onChange']) => {
      setValue('icon', newValue);
      fieldOnChange(newValue);
    },
    [setValue],
  );

  const handleSocialLinkChange = useCallback(
    (newSocialLinks: GroupSocialLink[], fieldOnChange: ControllerRenderProps['onChange']) => {
      const hasInvalidLink = newSocialLinks.find((link) => !validateGroupSocialLink(link));
      setHasError(hasInvalidLink !== undefined);

      setValue('socialLinks', newSocialLinks);
      fieldOnChange(newSocialLinks);
    },
    [setValue],
  );

  const handleOwnerChange = useCallback(
    (newOwner: User | null, fieldOnChange: ControllerRenderProps['onChange']) => {
      if (newOwner && newOwner.id !== groupConfiguration.owner.id) {
        setValue('owner', newOwner);
        setTransferRecipient(newOwner);
        fieldOnChange(newOwner);
      } else {
        setTransferRecipient(undefined);
        resetField('owner');
      }
    },
    [groupConfiguration.owner.id, resetField, setValue],
  );

  const configureGroupIcon = useCallback(
    async (groupId: number, icon: GroupIcon) => {
      if (!dirtyFields.icon || icon.file === undefined) {
        return Promise.resolve();
      }
      try {
        return await groupsClient.patchGroupIcon({
          groupId,
          files: icon.file,
        });
      } catch (errRes) {
        let errorMsgKey = 'Error.UnknownError';
        const err = await tryParseResponseError(errRes);
        if (err) {
          const nameOfError = getEnumKeyByValue(GroupErrorCodes, err.code);
          if (nameOfError) {
            errorMsgKey = `Error.${nameOfError}`;
          }
        }
        return Promise.reject(new Error(errorMsgKey));
      }
    },
    [dirtyFields],
  );

  const configureGroupName = useCallback(
    async (groupId: number, name: string) => {
      if (!dirtyFields.name) {
        return Promise.resolve();
      }
      try {
        return await groupsClient.patchGroupName({
          groupId,
          request: {
            name,
          },
        });
      } catch (errRes) {
        let errorMsgKey = 'Error.UnknownError';
        const err = await tryParseResponseError(errRes);
        if (err) {
          const nameOfError = getEnumKeyByValue(GroupErrorCodes, err.code);
          if (nameOfError) {
            errorMsgKey = `Error.${nameOfError}`;
          }
        }
        return Promise.reject(new Error(errorMsgKey));
      }
    },
    [dirtyFields],
  );

  const configureGroupDescription = useCallback(
    async (groupId: number, description: string) => {
      if (!dirtyFields.description) {
        return Promise.resolve();
      }
      try {
        return await groupsClient.patchGroupDescription({
          groupId,
          request: {
            description,
          },
        });
      } catch (errRes) {
        let errorMsgKey = 'Error.UnknownError';
        const err = await tryParseResponseError(errRes);
        if (err) {
          const nameOfError = getEnumKeyByValue(GroupErrorCodes, err.code);
          if (nameOfError) {
            errorMsgKey = `Error.${nameOfError}`;
          }
        }
        return Promise.reject(new Error(errorMsgKey));
      }
    },
    [dirtyFields],
  );

  const configureGroupSocialLinks = useCallback(
    async (
      groupId: number,
      previousSocialLinks: GroupSocialLink[],
      socialLinks: GroupSocialLink[],
    ) => {
      if (!dirtyFields.socialLinks) {
        return Promise.resolve();
      }
      try {
        // Delete or update existing links
        // ... delete must happen first since there is a 3 link limit
        const updatePromises = previousSocialLinks.map(async (prevLink) => {
          if (!prevLink.id) return undefined;

          const newLink = socialLinks.find((l) => l.id === prevLink.id);

          // Link does not exist anymore, delete it
          if (newLink === undefined) {
            await groupsClient.deleteGroupSocialLink({
              groupId,
              socialLinkId: prevLink.id,
            });
            return undefined;
          }

          // Link still exists, update if it has been modified
          if (
            newLink.title !== prevLink.title ||
            newLink.url !== prevLink.url ||
            newLink.type !== prevLink.type
          ) {
            return groupsClient.patchGroupSocialLink({
              groupId,
              socialLinkId: prevLink.id,
              request: {
                url: newLink.url,
                title: newLink.title,
                type: newLink.type,
              },
            });
          }

          return undefined;
        });

        // Create new links
        const creationPromises = socialLinks.map((newLink) => {
          // Do not save blank links
          if (!newLink.title || !newLink.url || !newLink.type) return undefined;

          // If link does not have id, then it has not yet been created
          if (!newLink.id) {
            return groupsClient.postGroupSocialLink({
              groupId,
              request: {
                url: newLink.url,
                title: newLink.title,
                type: newLink.type,
              },
            });
          }

          return undefined;
        });

        return await Promise.all([...updatePromises, ...creationPromises]);
      } catch (errRes) {
        let errorMsgKey = 'Error.UnknownError';
        const err = await tryParseResponseError(errRes);
        if (err) {
          const nameOfError = getEnumKeyByValue(GroupErrorCodes, err.code);
          if (nameOfError) {
            errorMsgKey = `Error.${nameOfError}`;
          }
        }
        return Promise.reject(new Error(errorMsgKey));
      }
    },
    [dirtyFields],
  );

  const configureOwner = useCallback(
    async (groupId: number, owner: User) => {
      if (!dirtyFields.owner || !owner.id) {
        return Promise.resolve();
      }
      try {
        const response = await groupsClient.postGroupOwner({
          groupId,
          changeOwnerRequest: {
            userId: owner.id,
          },
        });

        resetField('owner', { defaultValue: owner });

        await refreshPermission();

        return response;
      } catch (errRes) {
        let errorMsgKey = 'Error.UnknownError';
        const err = await tryParseResponseError(errRes);
        if (err) {
          const nameOfError = getEnumKeyByValue(GroupErrorCodes, err.code);
          if (nameOfError) {
            errorMsgKey = `Error.${nameOfError}`;
          }
        }
        return Promise.reject(new Error(errorMsgKey));
      }
    },
    [dirtyFields.owner, refreshPermission, resetField],
  );

  const configureAssetPrivacyDefault = useCallback(
    async (groupId: number, assetPrivacyDefaultRestricted: boolean) => {
      if (!enableCreatorPrivacySettings || !dirtyFields.assetPrivacyDefaultRestricted) {
        return Promise.resolve();
      }
      return updateAssetPrivacyDefault({
        creatorId: groupId,
        isRestricted: assetPrivacyDefaultRestricted,
      });
    },
    [
      dirtyFields.assetPrivacyDefaultRestricted,
      enableCreatorPrivacySettings,
      updateAssetPrivacyDefault,
    ],
  );

  const mergeErrorMsg = useCallback(
    (
      iconRes: PromiseSettledResult<unknown>,
      nameRes: PromiseSettledResult<unknown>,
      descriptionRes: PromiseSettledResult<unknown>,
      socialLinksRenameRes: PromiseSettledResult<unknown>,
      assetPrivacyDefaultRes: PromiseSettledResult<unknown>,
    ) => {
      const errorFields = [];
      let failureReasonKey = '';
      if (iconRes.status === 'rejected') {
        failureReasonKey = iconRes.reason.message;
        errorFields.push(translate('Label.Icon'));
      }
      if (nameRes.status === 'rejected') {
        failureReasonKey = nameRes.reason.message;
        errorFields.push(translate('Label.OrganizationName'));
      }
      if (descriptionRes.status === 'rejected') {
        failureReasonKey = descriptionRes.reason.message;
        errorFields.push(translate('Label.Description'));
      }
      if (socialLinksRenameRes.status === 'rejected') {
        failureReasonKey = socialLinksRenameRes.reason.message;
        errorFields.push(translate('Label.SocialLinks'));
      }
      if (assetPrivacyDefaultRes.status === 'rejected') {
        failureReasonKey = assetPrivacyDefaultRes.reason.message;
        errorFields.push('Heading.AssetPrivacy');
      }
      let errorFieldsString = '';
      if (errorFields) {
        errorFieldsString = translate('Error.PartialError', {
          fieldNameList: errorFields.join(', '),
        });
      }
      return `${translate(failureReasonKey)} ${errorFieldsString}`;
    },
    [translate],
  );

  const handleFormSubmit: SubmitHandler<ConfigureGroupFormType> = useCallback(
    async (data) => {
      setFormSubmissionErrorMsg(null);
      const [iconRes, nameRes, descriptionRes, socialLinksRes] = await Promise.allSettled([
        configureGroupIcon(groupConfiguration.id, data.icon),
        configureGroupName(groupConfiguration.id, data.name),
        configureGroupDescription(groupConfiguration.id, data.description),
        configureGroupSocialLinks(
          groupConfiguration.id,
          groupConfiguration.socialLinks,
          data.socialLinks,
        ),
      ]);
      const [assetPrivacyDefaultRes] = await Promise.allSettled([
        configureAssetPrivacyDefault(groupConfiguration.id, data.assetPrivacyDefaultRestricted),
      ]);
      const settledPromises = [
        iconRes,
        nameRes,
        descriptionRes,
        socialLinksRes,
        assetPrivacyDefaultRes,
      ];
      const rejected = settledPromises.filter((settled) => settled.status === 'rejected');

      // If all promises failed, then show first message
      if (rejected.length === settledPromises.length) {
        return setFormSubmissionErrorMsg(
          translate((iconRes as PromiseRejectedResult).reason.message),
        );
      }

      // Otherwise, update fields that succeeded and show error message for rest
      if (rejected.length > 0) {
        if (iconRes.status === 'fulfilled') {
          resetField('icon', { defaultValue: data.icon });
        }
        if (nameRes.status === 'fulfilled') {
          resetField('name', { defaultValue: data.name });
        }
        if (descriptionRes.status === 'fulfilled') {
          resetField('description', { defaultValue: data.description });
        }
        if (socialLinksRes.status === 'fulfilled') {
          resetField('socialLinks', { defaultValue: data.socialLinks });
        }
        if (assetPrivacyDefaultRes.status === 'fulfilled') {
          resetField('assetPrivacyDefaultRestricted', {
            defaultValue: data.assetPrivacyDefaultRestricted,
          });
        }
        return setFormSubmissionErrorMsg(
          mergeErrorMsg(iconRes, nameRes, descriptionRes, socialLinksRes, assetPrivacyDefaultRes),
        );
      }

      showBottomToast(translate('Message.ChangeSaved'));

      // Now try changing the owner, since all other changes have been made successfully
      await configureOwner(groupConfiguration.id, data.owner);

      if (dirtyFields.socialLinks && socialLinksRes.status === 'fulfilled') {
        // We need to call once to bust cache if links have changed, otherwise we will reload stale value
        await groupsClient.getGroupSocialLinks(groupConfiguration.id);
      }

      if (
        (dirtyFields.name && nameRes.status === 'fulfilled') ||
        (dirtyFields.description && descriptionRes.status === 'fulfilled')
      ) {
        // We need to call once to bust cache if name or description has changed, otherwise we will reload stale value
        await groupsClient.getGroupInfo(groupConfiguration.id);
      }

      logOrganizationsEvent(unifiedLogger, OrganizationsEventName.ClickOrgsUpdateGroupProfile, {
        group_id: groupConfiguration.id.toString(),
      });

      // If assetPrivacy was not updated, refresh the whole form
      // This is because: assetPrivacy updates already refresh the group form
      // Refreshing the group form twice causes small UI bugs
      if (dirtyFields.assetPrivacyDefaultRestricted === undefined) {
        return refreshGroupConfiguration();
      }
      return Promise.resolve();
    },
    [
      configureGroupIcon,
      groupConfiguration.id,
      groupConfiguration.socialLinks,
      configureGroupName,
      configureGroupDescription,
      configureGroupSocialLinks,
      configureAssetPrivacyDefault,
      showBottomToast,
      translate,
      dirtyFields,
      unifiedLogger,
      refreshGroupConfiguration,
      mergeErrorMsg,
      resetField,
      configureOwner,
    ],
  );

  useEffect(() => {
    if (reset) {
      reset(configureGroupFormDefaultValue);
    }
  }, [configureGroupFormDefaultValue, reset]);

  return (
    <Grid container item className={formContainer}>
      <Grid item>
        <GroupFeaturesStatus />
      </Grid>
      <Grid container item XSmall={12}>
        <Controller
          name='icon'
          control={control}
          render={({ field }) => (
            <IconUploader
              {...field}
              groupId={groupConfiguration.id}
              onSelectValue={(newValue) => handleIconChange(newValue, field.onChange)}
              disabled={isSubmitting || disabled || disabled}
            />
          )}
        />
      </Grid>
      <Grid container item XSmall={12} XLarge={6} className={inputFormPadding}>
        <Grid item XSmall={12}>
          <Controller
            name='name'
            control={control}
            rules={ConfigureGroupRegisterOptions.name}
            render={({ field }) => (
              <TextField
                {...field}
                error={!!errors.name}
                fullWidth
                multiline
                required
                id='name'
                inputProps={{ maxLength: 50 }}
                label={translate('Label.OrganizationName')}
                helperText={
                  errors?.name?.message
                    ? translate(errors.name.message)
                    : translate('Message.CharacterLimit', {
                        limit: '50',
                      })
                }
                disabled={isSubmitting || disabled || disabled}
              />
            )}
          />
          <Alert severity='info' variant='standard' className={alertContainer}>
            <Typography variant='body2' color='secondary'>
              <AlertTitle className={alertTitle}>{translate('Title.ChangeGroupName')}</AlertTitle>
              <Grid item>
                <li>
                  <span>{translate('Message.NameChangeCost')}</span>
                  &nbsp;
                  <RobuxIcon className={priceIcon} />
                  <span>{GroupNameChangeCost}.</span>
                </li>
              </Grid>
              <Grid item>
                <li>
                  <span>{translate('Message.OrganizationName')}</span>
                </li>
              </Grid>
            </Typography>
          </Alert>
        </Grid>

        <Grid item XSmall={12} className={descriptionField}>
          <Controller
            name='description'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                error={!!errors.description}
                fullWidth
                multiline
                id='description'
                inputProps={{ maxLength: 1000 }}
                label={translate('Label.Description')}
                helperText={
                  errors.description && errors.description.message
                    ? translate(errors.description.message)
                    : translate('Message.CharacterLimit', {
                        limit: '1000',
                      })
                }
                disabled={isSubmitting || disabled}
              />
            )}
          />
        </Grid>

        {!shouldHideSocialLinksSection && (
          <Grid container item XSmall={12} className={innerSectionPadding}>
            {shouldDisableSocialLinkCreation && (
              <SocialLinkAgeVerificationUpsellBanner
                title={translate(ageVerificationUpsellTitle)}
                description={translate(ageVerificationUpsellDescription)}
              />
            )}
            <Grid item XSmall={12}>
              <Typography variant='h3'>{translate('Label.SocialLinks')}</Typography>
            </Grid>
            <Grid item XSmall={12}>
              <Typography variant='captionBody' color='secondary'>
                {translate('Message.SocialLinks')}
              </Typography>
            </Grid>
            <Grid item XSmall={12}>
              <Controller
                name='socialLinks'
                control={control}
                render={({ field }) => (
                  <SocialLinksTable
                    {...field}
                    onChange={(newSocialLinks) =>
                      handleSocialLinkChange(newSocialLinks, field.onChange)
                    }
                    disabled={isSubmitting || disabled || shouldDisableSocialLinkCreation}
                  />
                )}
              />
            </Grid>
          </Grid>
        )}

        {enableCreatorPrivacySettings && (
          <Grid
            data-testid='asset-access-form'
            direction='column'
            container
            item
            XSmall={12}
            className={innerSectionPadding}>
            <Grid container item direction='row'>
              <Typography component='h4' variant='h4'>
                {translate('Heading.AssetPrivacy')}
              </Typography>
              <Label labelText='Beta' classes={{ root: betaLabel }} />
            </Grid>
            <Grid item container direction='row' alignItems='center'>
              <Typography variant='body1' color='secondary'>
                {translate('Description.AssetPrivacy')}
              </Typography>
              <Button
                className={dialogButton}
                onClick={() => {
                  setIsAssetPrivacyInfographicOpen(true);
                }}>
                <Typography variant='subtitle2'>{translate('Label.SeeHowItWorks')}</Typography>
              </Button>
            </Grid>
            <Controller
              name='assetPrivacyDefaultRestricted'
              control={control}
              render={({ field: renderField }) => (
                <FormControlLabel
                  control={
                    <Switch
                      aria-label={translate('Label.AllowRestrictedAssets')}
                      checked={renderField.value}
                      onChange={(e) => renderField.onChange(e.target.checked)}
                    />
                  }
                  label={translate('Label.AllowRestrictedAssets')}
                  sx={{ marginLeft: 0 }} // Override negative margin of FormControlLabel
                />
              )}
            />
          </Grid>
        )}
        <ConfigureGroupFormDialog
          cancelFunc={handleCancelDialog}
          confirmFunc={() => {
            handleSubmit(handleFormSubmit)();
            setConfirmationDialogOpen(false);
          }}
          fieldsToConfirm={dirtyFieldsRequiringConfirmation}
          isOpen={confirmationDialogOpen}
          transferRecipient={transferRecipient}
        />
        <AssetPrivacyInfographic
          isOpen={isAssetPrivacyInfographicOpen}
          onClose={() => setIsAssetPrivacyInfographicOpen(false)}
        />
        <Grid container item XSmall={12} className={innerSectionPadding}>
          <OwnershipSection
            groupConfiguration={groupConfiguration}
            control={control}
            isDisabled={isSubmitting || disabled}
            handleOwnerChange={handleOwnerChange}
          />
        </Grid>
      </Grid>
      <Grid container item XSmall={12} XLarge={8}>
        <Grid item XSmall={12}>
          <Divider />
        </Grid>
        <Grid container item XSmall={12} className={buttonContainer}>
          <Button
            variant='outlined'
            color='primary'
            size='large'
            onClick={handleFormCancel}
            disabled={isSubmitting || disabled}>
            {translate('Action.Cancel')}
          </Button>
          <Button
            className={configureButton}
            data-testid='configure-group-button'
            variant='contained'
            size='large'
            disabled={!isDirty || (!isValidating && !isValid) || hasError || disabled}
            onClick={
              dirtyFieldsRequiringConfirmation.length > 0
                ? () => {
                    setConfirmationDialogOpen(true);
                  }
                : handleSubmit(handleFormSubmit)
            }
            loading={isSubmitting || !isGroupConfigurationReady}>
            {translate('Action.SaveChanges')}
          </Button>

          <Grid item wrap='nowrap'>
            <Button
              data-testid='view-group-button'
              variant='text'
              color='primary'
              size='large'
              onClick={() =>
                window.open(
                  `https://www.${process.env.robloxSiteDomain}/groups/${groupConfiguration.id}`,
                  '_blank',
                )
              }
              loading={isSubmitting || !isGroupConfigurationReady}
              startIcon={<LaunchIcon color='secondary' />}>
              {translate('Action.ViewGroupExternal')}
            </Button>
          </Grid>

          {formSubmissionErrorMsg && (
            <FormHelperText className={errorMessageStyles}>{formSubmissionErrorMsg}</FormHelperText>
          )}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default ConfigureGroupForm;
