import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { useTranslation } from '@rbx/intl';
import {
  Alert,
  AlertTitle,
  Button,
  Divider,
  FormHelperText,
  Grid,
  Link,
  TextField,
  Typography,
  useMediaQuery,
  useSnackbar,
} from '@rbx/ui';
import FormMode from '@modules/miscellaneous/common/enums/FormMode';
import { developClient, tryParseResponseError } from '@modules/clients';
import { useRouter } from 'next/router';
import { getEnumKeyByValue } from '@modules/miscellaneous/common/utils';
import PremiumPayoutPageUrl from '../../common/constants/externalLinkConstants';
import { placeConfiguration } from '../containers/ConfigurePlaceContainer';
import useConfigurePlaceFormStyles from './ConfigurePlaceForm.styles';
import useCurrentPlace from '../hooks/useCurrentPlace';
import PlacesError from '../enums/PlacesError';

export const ConfigurePlaceRegisterOptions = {
  name: {
    required: 'Error.Required',
    maxLength: 50,
  },
  description: {
    maxLength: 1000,
  },
};

export type ConfigurePlaceFormType = {
  name: string;
  description: string;
};

export type TConfigurePlaceFormProps = {
  placeDetailsInfo: placeConfiguration;
  refreshData: () => void;
};

const ConfigurePlaceForm: FunctionComponent<React.PropsWithChildren<TConfigurePlaceFormProps>> = ({
  placeDetailsInfo,
  refreshData,
}) => {
  const {
    classes: {
      placeSubheader,
      buttonStyle,
      formPadding,
      errorMessageStyle,
      inputFormPadding,
      buttonContainerStyle,
    },
  } = useConfigurePlaceFormStyles();
  const { translate, translateHTML } = useTranslation();
  const router = useRouter();
  const { enqueue } = useSnackbar();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { isPlaceLoading } = useCurrentPlace();

  const {
    reset,
    handleSubmit,
    control,
    resetField,
    formState: { errors, isValid, isValidating, isDirty, isSubmitting, dirtyFields },
  } = useForm<ConfigurePlaceFormType>({
    mode: FormMode.OnChange,
    reValidateMode: FormMode.OnChange,
    shouldUnregister: true,
    defaultValues: {
      name: placeDetailsInfo.name,
      description: placeDetailsInfo.description,
    },
  });
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Large'));

  const showSuccessToast = useCallback(() => {
    enqueue(
      {
        message: (
          <span data-testid='success-message'>{translate('Message.PlaceUpdateSuccess')}</span>
        ),
        autoHide: true,
      },
      (reason) => reason === 'timeout',
    );
  }, [enqueue, translate]);

  const getErrorMessageKey = async (e: unknown) => {
    const err = await tryParseResponseError(e);
    if (!err) return 'Error.UnknownError';
    const nameOfError = getEnumKeyByValue(PlacesError, err.code);
    return nameOfError ? `Error.${nameOfError}` : 'Error.UnknownError';
  };

  const patchNameAndDescriptionData = useCallback(
    async (name: string, description: string) => {
      try {
        const request = { placeId: placeDetailsInfo.id, _configuration: { name, description } };
        return await developClient.patchPlaceConfigurationInfo(request);
      } catch (e) {
        let errorMsgKey = 'Error.UnknownError';
        errorMsgKey = await getErrorMessageKey(e);
        return Promise.reject(new Error(errorMsgKey));
      }
    },
    [placeDetailsInfo.id],
  );

  const createErrorMessage = useCallback(
    (patchNameAndDescriptionResult: PromiseSettledResult<unknown>) => {
      const errorFields = [];
      let failureReasonKey = '';
      if (patchNameAndDescriptionResult.status === 'rejected') {
        failureReasonKey = patchNameAndDescriptionResult.reason.message;
        if (dirtyFields.name) {
          errorFields.push(translate('Label.Name'));
        }
        if (dirtyFields.description) {
          errorFields.push(translate('Label.Description'));
        }
      }
      let errorFieldsString = '';
      if (errorFields && errorFields.length > 0) {
        errorFieldsString = translate('Error.PartialError', {
          fieldNameList: errorFields.join(', '),
        });
      }
      return `${translate(failureReasonKey)} ${errorFieldsString}`;
    },
    [translate, dirtyFields],
  );

  const patchPlaceData = useCallback(
    async (name: string, description: string) => {
      const [patchNameAndDescriptionResult] = await Promise.allSettled([
        patchNameAndDescriptionData(name, description),
      ]);
      if (patchNameAndDescriptionResult.status === 'rejected') {
        return setErrorMessage(createErrorMessage(patchNameAndDescriptionResult));
      }

      resetField('name', { defaultValue: name });
      resetField('description', { defaultValue: description });

      showSuccessToast();
      return refreshData();
    },
    [patchNameAndDescriptionData, showSuccessToast, refreshData, createErrorMessage, resetField],
  );

  const onButtonSubmit: SubmitHandler<ConfigurePlaceFormType> = useCallback(
    async (data) => {
      setErrorMessage('');
      await patchPlaceData(data.name, data.description);
    },
    [patchPlaceData],
  );

  const handleFormCancel = useCallback(() => {
    router.push(`/dashboard/creations/experiences/${router.query.id}/places`);
    /* eslint-disable-next-line react-hooks/exhaustive-deps --
     * (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
     * responsible for triaging issue.
     * */
  }, []);

  useEffect(() => {
    if (reset) {
      reset({
        name: placeDetailsInfo.name,
        description: placeDetailsInfo.description,
      });
    }
  }, [placeDetailsInfo, reset]);

  return (
    <Grid container direction='column' classes={{ root: formPadding }}>
      <Grid container item>
        <Grid item XSmall={12} classes={{ root: placeSubheader }}>
          <Typography variant='body1'>{translate('Message.ConfigurePlaceInfoNoGenre')}</Typography>
        </Grid>
      </Grid>
      <Grid
        container
        item
        direction='column'
        XSmall={12}
        XLarge={8}
        classes={{ root: inputFormPadding }}>
        <Grid item XSmall={12}>
          <Controller
            name='name'
            control={control}
            rules={ConfigurePlaceRegisterOptions.name}
            render={({ field }) => (
              <TextField
                {...field}
                error={!!errors.name}
                fullWidth
                multiline
                required
                id='name'
                label={translate('Label.Name')}
                InputLabelProps={{ shrink: true }}
                inputProps={{ maxLength: ConfigurePlaceRegisterOptions.name.maxLength }}
                helperText={
                  errors.name && errors.name.message
                    ? translate(errors.name.message)
                    : translate('Message.CharacterLimit', {
                        limit: ConfigurePlaceRegisterOptions.name.maxLength.toString(),
                      })
                }
              />
            )}
          />
        </Grid>
        <Grid item XSmall={12}>
          <Controller
            name='description'
            control={control}
            rules={ConfigurePlaceRegisterOptions.description}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                multiline
                id='description'
                label={translate('Label.Description')}
                error={!!errors.description}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  maxLength: ConfigurePlaceRegisterOptions.description.maxLength,
                }}
                helperText={translateHTML('Message.descriptionHelperText', [
                  {
                    opening: 'linkStart',
                    closing: 'linkEnd',
                    /* eslint-disable-next-line react/no-unstable-nested-components --
                     * (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
                     * responsible for triaging issue.
                     * */
                    content(chunks) {
                      return (
                        <Link href={PremiumPayoutPageUrl} target='_blank' underline='always'>
                          {chunks}
                        </Link>
                      );
                    },
                  },
                ])}
              />
            )}
          />
        </Grid>
        <Grid item XSmall={12}>
          <Alert severity='info' variant='standard'>
            <AlertTitle>{translate('Heading.PlaceAlertInfo')}</AlertTitle>
            <Typography>{translate('Message.PlaceAlertInfo')}</Typography>
          </Alert>
        </Grid>
      </Grid>
      <Grid container item XSmall={12} XLarge={8} direction='column'>
        <Grid item XSmall={12}>
          <Divider />
        </Grid>
        <Grid item XSmall={12} classes={{ root: buttonContainerStyle }}>
          <Grid container direction={isCompactView ? 'column' : 'row'}>
            <Button
              variant='outlined'
              color='primary'
              size='large'
              onClick={handleFormCancel}
              disabled={isSubmitting}
              data-testid='place-configure-cancel-button'>
              {translate('Action.Cancel')}
            </Button>
            <Button
              variant='contained'
              size='large'
              disabled={!isDirty || (!isValidating && !isValid) || isPlaceLoading}
              classes={{ root: buttonStyle }}
              loading={isSubmitting}
              onClick={handleSubmit(onButtonSubmit)}
              data-testid='place-configure-submit-button'>
              {translate('Action.SaveChanges')}
            </Button>
          </Grid>
          {errorMessage && (
            <FormHelperText data-testid='error-message' error classes={{ root: errorMessageStyle }}>
              {errorMessage}
            </FormHelperText>
          )}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default ConfigurePlaceForm;
