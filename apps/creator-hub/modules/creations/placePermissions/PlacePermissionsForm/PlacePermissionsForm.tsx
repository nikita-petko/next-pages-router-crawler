import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import type { ControllerRenderProps, SubmitHandler } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';
import type { SubjectActionRequest } from '@rbx/client-asset-permissions-api/v1';
import { AssetGrantableAction, SubjectType } from '@rbx/client-asset-permissions-api/v1';
import { useTranslation } from '@rbx/intl';
import {
  Alert,
  AlertTitle,
  Autocomplete,
  Button,
  Checkbox,
  Dialog,
  DialogTemplate,
  Divider,
  FormControlLabel,
  FormHelperText,
  Grid,
  Link,
  Radio,
  RadioGroup,
  TextField,
  Typography,
  useMediaQuery,
  useSnackbar,
} from '@rbx/ui';
import assetPermissionsApiClient from '@modules/clients/assetPermissions';
import developClient from '@modules/clients/develop';
import tryParseResponseError from '@modules/clients/utils/tryParseResponseError';
import { AllSettlePromiseFailed, FormMode } from '@modules/miscellaneous/common';
import AssetPermissionsError from '@modules/miscellaneous/common/enums/AssetPermissionsError';
import { www } from '@modules/miscellaneous/urls';
import { getEnumKeyByValue } from '@modules/miscellaneous/utils/enumUtils';
import AllowedGearType from '../../common/enums/AllowedGearType';
import { PlacesError } from '../../places/enums/PlacesError';
import type { PlacePermissionConfiguration } from '../types';
import usePlacePermissionsFormStyles from './PlacePermissionsForm.styles';
import type { PlacePermissionsFormType } from './types';
import { GearGenresAllowPolicy, InGamePermissionType } from './types';

export type PlacePermissionsFormProps = {
  placePermissionsValues: PlacePermissionConfiguration;
  refreshData: () => Promise<void>;
};

const PlacePermissionsForm: FunctionComponent<
  React.PropsWithChildren<PlacePermissionsFormProps>
> = ({ placePermissionsValues, refreshData }) => {
  const { translate, translateHTML } = useTranslation();
  const configurePlacePermissionsFormDefaultValue = useMemo(
    () => ({
      isCopyAllowed: placePermissionsValues.allowCoping,
      genresAllowedPolicy: placePermissionsValues.isAllGenresAllowed
        ? GearGenresAllowPolicy.All
        : GearGenresAllowPolicy.ExperienceGenre,
      allowedGearTypes: placePermissionsValues.allowedGearTypes,
      isUpdateFromRcc: placePermissionsValues.isUpdateFromRcc,
      isCopyFromRcc: placePermissionsValues.isCopyFromRcc,
    }),
    [placePermissionsValues],
  );

  const {
    classes: {
      formContainer,
      inputFormPadding,
      checkboxPadding,
      divider,
      button,
      error,
      radioGroup,
      textFieldPadding,
      warningAlertStyles,
    },
  } = usePlacePermissionsFormStyles();
  const {
    handleSubmit,
    control,
    formState: { isSubmitting, isValidating, isValid, isDirty, dirtyFields },
    reset,
    resetField,
    setValue,
  } = useForm<PlacePermissionsFormType>({
    mode: FormMode.OnChange,
    reValidateMode: FormMode.OnChange,
    defaultValues: configurePlacePermissionsFormDefaultValue,
    shouldUnregister: false,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCopyLockWarningAlert, setShowCopyLockWarningAlert] = useState<boolean>(false);
  const [showCopyLockChangeDialog, setShowCopyLockChangeDialog] = useState<boolean>(false);
  const { enqueue } = useSnackbar();
  const router = useRouter();
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Large'));
  const getGearTypeOptions = Object.values(AllowedGearType)
    .filter((x) => x !== AllowedGearType.Invalid)
    .filter((x) => typeof x === 'number');
  const showSuccessToast = useCallback(() => {
    enqueue(
      {
        message: translate('Message.ChangesSavedSuccess'),
        autoHide: true,
      },
      (reason) => reason === 'timeout',
    );
  }, [enqueue, translate]);

  const handleFormCancel = useCallback(() => {
    router.push(`/dashboard/creations/experiences/${router.query.id}/places`);
  }, [router]);

  const handleCopyLockOnchange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, fieldOnChange: ControllerRenderProps['onChange']) => {
      const isCopyAllowed = e.target.checked;
      setValue('isCopyAllowed', isCopyAllowed);
      fieldOnChange(e);
      // This will mean the warning will show up if there is a change
      // and the result is true.
      setShowCopyLockWarningAlert(isCopyAllowed);
    },
    [setValue],
  );

  const configurePlaceDetails = useCallback(
    async (data: PlacePermissionsFormType) => {
      if (
        dirtyFields.isCopyAllowed ||
        dirtyFields.genresAllowedPolicy ||
        dirtyFields.allowedGearTypes
      ) {
        try {
          const request = {
            placeId: placePermissionsValues.placeId,
            _configuration: {
              allowCopying: data.isCopyAllowed,
              isAllGenresAllowed: data.genresAllowedPolicy === GearGenresAllowPolicy.All,
              allowedGearTypes: data.allowedGearTypes.map((gearType) => gearType.toString()),
            },
          };
          await developClient.patchPlaceConfigurationInfo(request);
          resetField('isCopyAllowed', { defaultValue: data.isCopyAllowed });
          resetField('genresAllowedPolicy', { defaultValue: data.genresAllowedPolicy });
          resetField('allowedGearTypes', { defaultValue: data.allowedGearTypes });
        } catch (errRes) {
          const parsedError = await tryParseResponseError(errRes);
          let translatedErrorMessage = '';
          if (parsedError && Object.values(PlacesError).includes(parsedError.code)) {
            const nameOfError = getEnumKeyByValue(PlacesError, parsedError.code);
            if (nameOfError) {
              translatedErrorMessage = translate(`Error.${nameOfError}`);
            }
          }
          if (translatedErrorMessage === '') {
            translatedErrorMessage = translate('Error.UnknownErrorMessage');
          }
          return Promise.reject(new Error(translatedErrorMessage));
        }
      }
      return;
    },
    [
      dirtyFields.allowedGearTypes,
      dirtyFields.genresAllowedPolicy,
      dirtyFields.isCopyAllowed,
      placePermissionsValues.placeId,
      resetField,
      translate,
    ],
  );

  const getSubjectActionsRequest = useCallback(
    (actionArray: AssetGrantableAction[]) => {
      const universeId = router.query.id as string;
      return actionArray.map((action) => {
        const request = {
          subjectType: SubjectType.Universe,
          subjectId: universeId,
          action,
        } as SubjectActionRequest;
        return request;
      });
    },
    [router.query.id],
  );

  const grantAndRevorkPlacePermission = useCallback(
    async (isAllowed: boolean, inGamePermissionType: InGamePermissionType) => {
      const subjectActionsRequest = getSubjectActionsRequest([
        inGamePermissionType === InGamePermissionType.CopyFromRcc
          ? AssetGrantableAction.CopyFromRcc
          : AssetGrantableAction.UpdateFromRcc,
      ]);
      if (isAllowed) {
        await assetPermissionsApiClient.grantAssetPermissions(
          placePermissionsValues.placeId,
          subjectActionsRequest,
        );
      } else {
        await assetPermissionsApiClient.revokeAssetPermissions(
          placePermissionsValues.placeId,
          subjectActionsRequest,
        );
      }
    },
    [getSubjectActionsRequest, placePermissionsValues.placeId],
  );

  const ConfigurePlaceInGamePermission = useCallback(
    async (data: PlacePermissionsFormType) => {
      try {
        if (dirtyFields.isCopyFromRcc && dirtyFields.isUpdateFromRcc) {
          const subjectActionsRequest = getSubjectActionsRequest([
            AssetGrantableAction.CopyFromRcc,
            AssetGrantableAction.UpdateFromRcc,
          ]);
          if (data.isCopyFromRcc && data.isUpdateFromRcc) {
            await assetPermissionsApiClient.grantAssetPermissions(
              placePermissionsValues.placeId,
              subjectActionsRequest,
            );
          } else if (!data.isCopyFromRcc && !data.isUpdateFromRcc) {
            await assetPermissionsApiClient.revokeAssetPermissions(
              placePermissionsValues.placeId,
              subjectActionsRequest,
            );
          } else {
            // not use promise.all() due to backend can not support synchronous requests
            await grantAndRevorkPlacePermission(
              data.isCopyFromRcc,
              InGamePermissionType.CopyFromRcc,
            );
            await grantAndRevorkPlacePermission(
              data.isUpdateFromRcc,
              InGamePermissionType.UpdateFromRcc,
            );
          }
        } else if (dirtyFields.isCopyFromRcc) {
          await grantAndRevorkPlacePermission(data.isCopyFromRcc, InGamePermissionType.CopyFromRcc);
        } else if (dirtyFields.isUpdateFromRcc) {
          await grantAndRevorkPlacePermission(
            data.isUpdateFromRcc,
            InGamePermissionType.UpdateFromRcc,
          );
        }
        resetField('isCopyFromRcc', { defaultValue: data.isCopyFromRcc });
        resetField('isUpdateFromRcc', { defaultValue: data.isUpdateFromRcc });
      } catch (e) {
        const assetPermissionsError = await tryParseResponseError(e);
        if (assetPermissionsError) {
          const nameOfError = getEnumKeyByValue(AssetPermissionsError, assetPermissionsError.code);
          if (nameOfError) {
            return Promise.reject(new Error(translate(`Error.assetPermissions.${nameOfError}`)));
          }
        }
        return Promise.reject(new Error(translate('Error.UnknownErrorMessage')));
      }
      return;
    },
    [
      dirtyFields.isCopyFromRcc,
      dirtyFields.isUpdateFromRcc,
      getSubjectActionsRequest,
      grantAndRevorkPlacePermission,
      placePermissionsValues.placeId,
      resetField,
      translate,
    ],
  );

  const mergeErrorMessage = useCallback(
    (responses: PromiseSettledResult<unknown>[]) => {
      const [configurePlaceDetailsRes, inGamePermissionRes] = responses;
      if (responses.every((res) => res.status === AllSettlePromiseFailed)) {
        return (configurePlaceDetailsRes as PromiseRejectedResult).reason.message;
      }

      let errorField = '';
      let failureReason = '';
      if (configurePlaceDetailsRes.status === AllSettlePromiseFailed) {
        failureReason = configurePlaceDetailsRes.reason.message;
        errorField = translate('Label.placeDetails');
      }

      if (inGamePermissionRes.status === AllSettlePromiseFailed) {
        failureReason = inGamePermissionRes.reason.message;
        errorField = translate('Label.inGamePermissionField');
      }

      let errorFieldsString = '';
      if (errorField) {
        errorFieldsString = translate('Error.PartialError', {
          fieldNameList: errorField,
        });
      }
      if (errorField !== '') {
        return `${failureReason} ${errorFieldsString}`;
      }
      return `${failureReason} ${translate('Message.PleaseTryAgain')}`;
    },
    [translate],
  );

  const handleFormSubmit: SubmitHandler<PlacePermissionsFormType> = useCallback(
    async (data) => {
      setErrorMessage(null);
      const responses = await Promise.allSettled([
        configurePlaceDetails(data),
        ConfigurePlaceInGamePermission(data),
      ]);

      if (responses.some((res) => res.status === AllSettlePromiseFailed)) {
        setErrorMessage(mergeErrorMessage(responses));
      } else {
        await refreshData();
        showSuccessToast();
      }
    },
    [
      ConfigurePlaceInGamePermission,
      configurePlaceDetails,
      mergeErrorMessage,
      refreshData,
      showSuccessToast,
    ],
  );

  const handleFormButton = useCallback(() => {
    if (dirtyFields.isCopyAllowed && showCopyLockWarningAlert) {
      setShowCopyLockChangeDialog(true);
    } else {
      handleSubmit(handleFormSubmit)();
    }
  }, [dirtyFields, handleSubmit, handleFormSubmit, showCopyLockWarningAlert]);

  const handleDialogConfirm = useCallback(() => {
    setShowCopyLockChangeDialog(false);
    handleSubmit(handleFormSubmit)();
  }, [handleSubmit, handleFormSubmit]);

  const handleRadioOnchange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, fieldOnChange: ControllerRenderProps['onChange']) => {
      const gearGenresAllowPolicy = e.target.value as keyof typeof GearGenresAllowPolicy;
      setValue('genresAllowedPolicy', GearGenresAllowPolicy[gearGenresAllowPolicy]);
      fieldOnChange(e);
    },
    [setValue],
  );

  useEffect(() => {
    if (reset) {
      reset(configurePlacePermissionsFormDefaultValue);
    }
  }, [configurePlacePermissionsFormDefaultValue, reset]);

  return (
    <Grid container className={formContainer}>
      <Grid container item XSmall={12} className={inputFormPadding}>
        <Grid item>
          <Typography variant='h2'>{translate('Label.BasicSettings')}</Typography>
        </Grid>

        <Grid item XSmall={12}>
          <Typography color='secondary'>{translate('Title.CopyLock')}</Typography>
          <Grid item XSmall={12} classes={{ root: checkboxPadding }}>
            <Controller
              name='isCopyAllowed'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      aria-label={translate('Label.CopyLock')}
                      color='secondary'
                      onChange={(e) => handleCopyLockOnchange(e, field.onChange)}
                      checked={field.value}
                    />
                  }
                  label={translate('Label.CopyLock')}
                />
              )}
            />
          </Grid>
          <FormHelperText>
            {translateHTML('Message.CopyLockingHelperText', [
              {
                opening: 'linkStart',
                closing: 'linkEnd',
                content(robloxTermsOfUseText) {
                  return (
                    <Link href={www.getTermsUrl()} target='_blank'>
                      {robloxTermsOfUseText}
                    </Link>
                  );
                },
              },
            ])}
          </FormHelperText>
          {showCopyLockWarningAlert && (
            <Grid item XSmall={12}>
              <Alert severity='warning' variant='standard' className={warningAlertStyles}>
                <AlertTitle>
                  <span> {translate('Message.CopyLockWarning')}</span>{' '}
                  <Link href={www.getTermsUrl()} color='inherit' underline='always'>
                    {translate('Label.LearnMore')}
                  </Link>
                </AlertTitle>
              </Alert>
            </Grid>
          )}
        </Grid>

        <Grid item XSmall={12}>
          <Typography color='secondary'>{translate('Label.InGame')}</Typography>
          <Grid item XSmall={12} classes={{ root: checkboxPadding }}>
            <Controller
              name='isCopyFromRcc'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      aria-label={translate('Label.AllowCopyFromRcc')}
                      color='secondary'
                      onChange={field.onChange}
                      checked={field.value}
                    />
                  }
                  label={translate('Label.AllowCopyFromRcc')}
                />
              )}
            />
          </Grid>
          <Grid item XSmall={12} classes={{ root: checkboxPadding }}>
            <Controller
              name='isUpdateFromRcc'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      aria-label={translate('Label.AllowUpdateFromRcc')}
                      color='secondary'
                      onChange={field.onChange}
                      checked={field.value}
                    />
                  }
                  label={translate('Label.AllowUpdateFromRcc')}
                />
              )}
            />
          </Grid>
        </Grid>
      </Grid>
      <Grid container item XSmall={12} XLarge={8} className={inputFormPadding}>
        <Grid item>
          <Typography variant='h2'>{translate('Label.GearSettings')}</Typography>
        </Grid>

        <Grid item container XSmall={12}>
          <Typography color='secondary'>{translate('Label.GearGenres')}</Typography>
          <Grid item XSmall={12}>
            <Controller
              name='genresAllowedPolicy'
              control={control}
              render={({ field }) => (
                <RadioGroup
                  {...field}
                  id='genresAllowedPolicy'
                  classes={{ root: radioGroup }}
                  onChange={(e) => handleRadioOnchange(e, field.onChange)}>
                  <Grid item XSmall={12}>
                    <FormControlLabel
                      value={GearGenresAllowPolicy.ExperienceGenre}
                      control={<Radio aria-label={translate('Label.AllowGearFromExperience')} />}
                      label={
                        <Typography variant='body1'>
                          {translate('Label.AllowGearFromExperience')}
                        </Typography>
                      }
                    />
                  </Grid>
                  <Grid item XSmall={12}>
                    <FormControlLabel
                      value={GearGenresAllowPolicy.All}
                      control={<Radio aria-label={translate('Label.AllowAllGearGenres')} />}
                      label={
                        <Typography variant='body1'>
                          {translate('Label.AllowAllGearGenres')}
                        </Typography>
                      }
                    />
                  </Grid>
                </RadioGroup>
              )}
            />
          </Grid>
        </Grid>

        <Grid item container XSmall={12}>
          <Grid item XSmall={12}>
            <Typography color='secondary'>{translate('Label.GearTypes')}</Typography>
          </Grid>
          <Grid item XSmall={12} Large={6} XXLarge={4}>
            <Controller
              name='allowedGearTypes'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  {...field}
                  value={field.value}
                  classes={{ root: textFieldPadding }}
                  fullWidth
                  options={getGearTypeOptions}
                  getOptionLabel={(option) =>
                    translate(`Label.${getEnumKeyByValue(AllowedGearType, option)}`)
                  }
                  onChange={(e, value) => {
                    field.onChange(value);
                  }}
                  multiple
                  renderInput={(params) => (
                    <TextField {...params} id='values' label={translate('Message.ChooseTypes')} />
                  )}
                />
              )}
            />
          </Grid>
        </Grid>
      </Grid>
      <Grid container item XSmall={12} XLarge={8}>
        <Grid item XSmall={12}>
          <Divider className={divider} />
        </Grid>
        <Grid container item direction={isCompactView ? 'column' : 'row'}>
          <Button
            data-testid='cancel-button'
            className={button}
            size='large'
            variant='outlined'
            color='primary'
            onClick={handleFormCancel}>
            {translate('Action.Cancel')}
          </Button>
          <Button
            data-testid='save-button'
            size='large'
            variant='contained'
            color='primaryBrand'
            loading={isSubmitting}
            disabled={!isValid || isValidating || !isDirty}
            onClick={handleFormButton}>
            {translate('Action.SaveChanges')}
          </Button>
          <Dialog
            open={showCopyLockChangeDialog}
            onClose={() => setShowCopyLockChangeDialog(false)}>
            <DialogTemplate
              title={translate('Title.CopyLockChange')}
              content={translate('Description.CopyLockChange')}
              cancelText={translate('Action.BackToEditing')}
              onCancel={() => setShowCopyLockChangeDialog(false)}
              confirmText={translate('Action.Confirm')}
              onConfirm={handleDialogConfirm}
            />
          </Dialog>
        </Grid>
        {errorMessage && (
          <Grid className={error}>
            <Typography variant='smallLabel2' color='error'>
              {errorMessage}
            </Typography>
          </Grid>
        )}
      </Grid>
    </Grid>
  );
};

export default PlacePermissionsForm;
