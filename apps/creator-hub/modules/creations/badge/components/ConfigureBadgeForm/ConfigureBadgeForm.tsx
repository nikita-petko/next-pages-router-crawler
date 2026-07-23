import React, { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';

import { badgesClient, GetBadgeByIdResponse, GetBadgesMetadataResponse } from '@modules/clients';
import { useTranslation } from '@rbx/intl';
import {
  Divider,
  FormControlLabel,
  FormHelperText,
  Grid,
  Link,
  Switch,
  TextField,
  Typography,
  useSnackbar,
  VisuallyHidden,
  Button,
} from '@rbx/ui';

import { ThumbnailImageUploader } from '@modules/miscellaneous/common/components/uploaders';
import { ThumbnailTypes } from '@rbx/thumbnails';
import { urls } from '@modules/miscellaneous/common';
import { useRouter } from 'next/router';
import GenericBEDEV1Error from '@modules/clients/errors/GenericBEDEV1Error';
import FormMode from '@modules/miscellaneous/common/enums/FormMode';
// eslint-disable-next-line no-restricted-imports -- deep import; localization root barrel removed
import useLanguageManagement from '@modules/localization/localization/hooks/useLanguageManagement';
// eslint-disable-next-line no-restricted-imports -- deep import; localization root barrel removed
import { rtlLanguages } from '@modules/localization/translation/constants';
import useBadgeConfigureFormStyles from './ConfigureBadgeForm.styles';
import { ConfigureBadgeRegisterOptions, ConfigureBadgeFormType } from './types';
import badgeErrorCodeToDescription from '../../constants/badgeErrorCodesDescription';
import BadgesErrorCodes from '../../enums/BadgeErrorCodes';

const {
  creatorHub: { docs },
} = urls;
export type TBadgeConfigureFormProps = {
  badgeMetadata: GetBadgesMetadataResponse;
  badgeDetails: GetBadgeByIdResponse;
};

const BadgeConfigureForm: FunctionComponent<React.PropsWithChildren<TBadgeConfigureFormProps>> = ({
  badgeDetails,
  badgeMetadata,
}) => {
  const {
    classes: {
      typographyStyle,
      buttonStyle,
      errorMessageStyle,
      formPadding,
      inputFormPadding,
      switchPadding,
      rtlInputStyle,
    },
  } = useBadgeConfigureFormStyles();
  const { translate } = useTranslation();
  const { enqueue } = useSnackbar();
  const [errorMessage, setErrorMessage] = useState<string>('');
  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    getValues,
    formState: { errors, isValid, isValidating, isDirty, isSubmitting },
  } = useForm<ConfigureBadgeFormType>({
    mode: FormMode.OnChange,
    defaultValues: {
      name: badgeDetails.name ?? '',
      description: badgeDetails.description ?? '',
      isItemActive: badgeDetails.enabled,
    },
    reValidateMode: FormMode.OnChange,
    shouldUnregister: true,
  });
  const router = useRouter();
  const { sourceLanguageCode } = useLanguageManagement();

  const handleFileChange = useCallback(
    (file: File | null) => {
      setValue('file', file, { shouldValidate: true, shouldDirty: true });
    },
    [setValue],
  );

  const showSuccessToast = useCallback(() => {
    enqueue(
      {
        message: translate('Message.BadgeUpdateSuccess'),
        autoHide: true,
      },
      (reason) => reason === 'timeout',
    );
    /* eslint-disable-next-line react-hooks/exhaustive-deps -- NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
     * responsible for triaging issue.
     */
  }, []);

  const backToOverviewPage = useCallback(async () => {
    const { id, badgeId } = router.query;
    const pathname = router.pathname.replace('configure', 'overview');

    await router.replace({
      pathname,
      query: { id, badgeId },
    });
  }, [router]);

  // helper function for patching badge details, returns boolean indicating if request was successful
  const patchBadgeData = useCallback(
    async (badgeId: number, name: string, description: string, isActive: boolean) => {
      try {
        await badgesClient.patchBadgeDetails(badgeId, name, isActive, description);
        return true;
      } catch (e) {
        if (e instanceof GenericBEDEV1Error && Object.values(BadgesErrorCodes).includes(e.code)) {
          setErrorMessage(translate(badgeErrorCodeToDescription[e.code as BadgesErrorCodes]));
        } else {
          setErrorMessage(translate('Error.Submit'));
        }
        return false;
      }
    },
    [translate],
  );

  // helper function for patching badge icon, returns boolean indicating if request was successful
  const patchBadgeIcon = useCallback(
    async (badgeId: number, badgeIcon: File | null) => {
      try {
        if (badgeIcon) {
          await badgesClient.patchBadgeIcon(badgeId, badgeIcon as Blob);
        }
        return true;
      } catch (e) {
        if (e instanceof GenericBEDEV1Error && Object.values(BadgesErrorCodes).includes(e.code)) {
          setErrorMessage(translate(badgeErrorCodeToDescription[e.code as BadgesErrorCodes]));
        } else {
          setErrorMessage(translate('Error.Submit'));
        }
        return false;
      }
    },
    [translate],
  );

  const patchBadgeDataAndIcon = useCallback(
    async (data: ConfigureBadgeFormType) => {
      const badgeId = badgeDetails?.id ?? 0;
      const [badgeDetailsPatchSuccessful, badgeIconPatchSuccessful] = await Promise.all([
        patchBadgeData(badgeId, data.name, data.description, data.isItemActive),
        patchBadgeIcon(badgeId, data.file),
      ]);

      if (badgeDetailsPatchSuccessful && badgeIconPatchSuccessful) {
        showSuccessToast();
        reset(getValues());
      }
    },
    [badgeDetails?.id, patchBadgeData, patchBadgeIcon, showSuccessToast, reset, getValues],
  );

  const onButtonSubmit: SubmitHandler<ConfigureBadgeFormType> = useCallback(
    (data) => {
      setErrorMessage('');
      return patchBadgeDataAndIcon(data);
    },
    [patchBadgeDataAndIcon],
  );

  const getTextLengthMessage = (max: number, current: number) => {
    if (current === 0) {
      return translate('Message.CharacterLimit', { limit: String(max) });
    }
    return translate('Message.ProgressiveCharacterLimit', { count: String(max - current) });
  };

  const inputStyleWithRtlSupport = useMemo(
    () => (rtlLanguages.has(sourceLanguageCode ?? '') ? rtlInputStyle : ''),
    /* eslint-disable-next-line react-hooks/exhaustive-deps -- NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
     * responsible for triaging issue.
     */
    [sourceLanguageCode],
  );

  useEffect(() => {
    register('file');
  }, [register]);

  return (
    <Grid container direction='column' className={formPadding}>
      <Grid container item>
        <Grid item XSmall={12} className={typographyStyle}>
          <Typography variant='body1'>
            {translate('Message.CreateBadgeInfo')}&nbsp;
            <Link
              href={docs.getBadgesPublishingUrl()}
              aria-label={`${translate('Message.CreateBadgeInfo')}${translate('Label.LearnMore')}`}
              target='_blank'>
              {translate('Label.LearnMore')}
            </Link>
          </Typography>
        </Grid>
      </Grid>
      <Grid container item direction='row' XSmall={12}>
        <ThumbnailImageUploader
          targetId={badgeDetails?.id}
          targetType={ThumbnailTypes.badgeIcon}
          onChange={handleFileChange}
          imageAltText={translate('Label.BadgeImage')}
          ariaDescribedBy='thumbnail-aria-description'
          imageType={['jpg', 'png', 'tga', 'bmp']}
        />
        <VisuallyHidden id='thumbnail-aria-description' aria-live='polite'>
          {getValues('file')?.name
            ? translate('Label.SelectedFile', { fileName: getValues('file')?.name ?? '' })
            : translate('Label.NoImageUploaded')}
        </VisuallyHidden>
      </Grid>
      <Grid container item direction='column' XSmall={12} XLarge={6} className={inputFormPadding}>
        <Grid item XSmall={12}>
          <Controller
            name='name'
            control={control}
            rules={ConfigureBadgeRegisterOptions.name}
            render={({ field }) => (
              <TextField
                {...field}
                required
                fullWidth
                multiline
                id='name'
                label={translate('Label.Name')}
                error={!!errors.name}
                inputProps={{ maxLength: badgeMetadata.maxBadgeNameLength }}
                InputLabelProps={{ shrink: true }}
                FormHelperTextProps={{ 'aria-live': 'polite' }}
                helperText={
                  errors.name && errors.name.message
                    ? translate(errors.name.message)
                    : getTextLengthMessage(50, getValues('name').length)
                }
                className={inputStyleWithRtlSupport}
              />
            )}
          />
        </Grid>
        <Grid item XSmall={12}>
          <Controller
            name='description'
            control={control}
            rules={ConfigureBadgeRegisterOptions.description}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                multiline
                id='description'
                label={translate('Label.Description')}
                error={!!errors.description}
                inputProps={{ maxLength: badgeMetadata.maxBadgeDescriptionLength }}
                InputLabelProps={{ shrink: true }}
                FormHelperTextProps={{ 'aria-live': 'polite' }}
                helperText={
                  errors.description && errors.description.message
                    ? translate(errors.description.message)
                    : getTextLengthMessage(1000, getValues('description').length)
                }
                className={inputStyleWithRtlSupport}
              />
            )}
          />
        </Grid>
        <Grid item XSmall={12}>
          <Controller
            name='isItemActive'
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch
                    aria-label={translate('Label.BadgeIsEnabled')}
                    onChange={(e) => field.onChange(e.target.checked)}
                    checked={field.value}
                  />
                }
                className={switchPadding}
                label={translate('Label.BadgeIsEnabled')}
              />
            )}
          />
          <FormHelperText>{translate('Message.BadgeEnabledDescription')}</FormHelperText>
        </Grid>
      </Grid>
      <Grid container item spacing={4} XSmall={12} XLarge={8} direction='column'>
        <Grid item XSmall={12}>
          <Divider />
        </Grid>
        <Grid item XSmall={12}>
          <Button
            variant='outlined'
            color='primary'
            size='large'
            onClick={backToOverviewPage}
            disabled={isSubmitting}>
            {translate('Action.Cancel')}
          </Button>
          <Button
            variant='contained'
            size='large'
            disabled={!isDirty || (!isValidating && !isValid)}
            className={buttonStyle}
            loading={isSubmitting}
            onClick={handleSubmit(onButtonSubmit)}>
            {translate('Action.SaveChanges')}
          </Button>
          {errorMessage && (
            <FormHelperText error className={errorMessageStyle}>
              {errorMessage}
            </FormHelperText>
          )}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default BadgeConfigureForm;
