import { Fragment, useCallback, useState } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';
import type { ErrorResponse } from '@rbx/client-developer-subscriptions-api/v1';
import { FailureReason } from '@rbx/client-developer-subscriptions-api/v1';
import {
  Alert,
  AlertTitle,
  Button,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  EditOutlinedIcon,
  Grid,
  IconButton,
  InputAdornment,
  Link,
  TextField,
  Typography,
} from '@rbx/ui';
import experienceSubscriptionsClient from '@modules/clients/experienceSubscriptions';
import { getResponseFromError } from '@modules/clients/utils';
import { FormMode } from '@modules/miscellaneous/common';
import { SUBSCRIPTION_LEARN_MORE_URL } from '@modules/miscellaneous/common/constants/linkConstants';
import type { ShortenedExperienceNameModalFormType } from '../../constants/ShortenedExperienceNameRegisterConstants';
import {
  ShortenedExperienceNameModalDefaultValue,
  ShortenedExperienceNameModalRegisterOptions,
} from '../../constants/ShortenedExperienceNameRegisterConstants';
import useSubscriptionFormStyles from '../ExperienceSubscription.styles';

type Props = {
  suggestedName: string;
  onCancel: () => void;
  onSuccess: () => void;
  translate: (
    key: string,
    args?: {
      [key: string]: string;
    },
  ) => string;
  translateHTML: (
    key: string,
    tags?:
      | {
          opening: string;
          closing: string;
          content: (chunks: React.ReactNode) => React.ReactNode;
        }[]
      | null,
    args?: {
      [key: string]: React.ReactNode;
    },
  ) => React.ReactNode;
  universeId: number;
  showCenterMsg: (msg: string, successful: boolean) => void;
};

function ShortenedExperienceNameModal({
  suggestedName,
  translate,
  translateHTML,
  onCancel,
  onSuccess,
  universeId,
  showCenterMsg,
}: Props) {
  const {
    classes: { createButton, inputFormPadding },
  } = useSubscriptionFormStyles();

  const { formState, handleSubmit, watch, control, setValue, setError } =
    useForm<ShortenedExperienceNameModalFormType>({
      mode: FormMode.OnTouched,
      reValidateMode: FormMode.OnChange,
      defaultValues: {
        name: suggestedName || ShortenedExperienceNameModalDefaultValue.name,
        confirmedName: suggestedName || ShortenedExperienceNameModalDefaultValue.confirmedName,
      },
      shouldUnregister: true,
    });
  const { isSubmitting, errors, isValid, isValidating } = formState;
  const name = watch('name');
  const [editMode, setEditMode] = useState(false);

  const handleFormSubmit: SubmitHandler<ShortenedExperienceNameModalFormType> = useCallback(
    async (data) => {
      if (!universeId) {
        return;
      }
      const nameToUse = data.confirmedName ? data.confirmedName.trim() : data.name.trim();
      try {
        await experienceSubscriptionsClient.confirmShortenedExperienceName(universeId, nameToUse);
        showCenterMsg(translate('Message.SENCreationSuccess'), true);
        onSuccess();
      } catch (error) {
        const errorResponse = getResponseFromError(error);

        if (errorResponse?.status === 500) {
          showCenterMsg(translate('Error.UnknownSubscriptionError'), false);
          return;
        }

        const d = (await errorResponse?.json()) as ErrorResponse;

        switch (d.failureReason) {
          case FailureReason.ShortenedNameModerated:
            setValue('name', d.hint ?? data.name);
            setValue('confirmedName', '');
            setError('name', { type: 'manual', message: 'Error.ModeratedName' });
            setEditMode(true);
            break;
          case FailureReason.ShortenedNameTaken:
            setError('name', { type: 'manual', message: 'Error.NameTaken' });
            setValue('confirmedName', '');
            setEditMode(true);
            break;
          default:
            showCenterMsg(translate('Error.UnknownSubscriptionError'), false);
        }
      }

      return;
    },
    [onSuccess, setError, setValue, showCenterMsg, translate, universeId],
  );

  const enableEditMode = useCallback(() => {
    setValue('confirmedName', '');
    setEditMode(true);
  }, [setValue]);

  return (
    <>
      <DialogTitle>{translate('Heading.SEN')}</DialogTitle>
      <DialogContent dividers>
        <DialogContentText>
          <Typography>
            {translateHTML('Description.SENContext', [
              {
                opening: 'LinkStart',
                closing: 'LinkEnd',
                content(chunks: React.ReactNode) {
                  return (
                    <Link href={SUBSCRIPTION_LEARN_MORE_URL} target='_blank' color='primary'>
                      {chunks}
                    </Link>
                  );
                },
              },
            ])}
          </Typography>
          <br />
          <br />
          <Typography>{translate('Description.SENActivationWarning')}</Typography>
        </DialogContentText>
        <Grid
          container
          item
          direction='column'
          XSmall={12}
          mt={3}
          classes={{ root: inputFormPadding }}>
          <Grid item XSmall={12}>
            <Controller
              name='name'
              control={control}
              rules={ShortenedExperienceNameModalRegisterOptions.name}
              render={({ field }) => (
                <TextField
                  {...field}
                  error={!!errors.name}
                  fullWidth
                  multiline
                  required
                  id='name'
                  disabled={!editMode}
                  label={translate('Heading.SEN')}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton
                          data-testid='show-password-button'
                          onClick={enableEditMode}
                          aria-label=''>
                          {!editMode && <EditOutlinedIcon fontSize='medium' color='secondary' />}
                        </IconButton>
                      </InputAdornment>
                    ),
                    inputProps: {
                      maxLength: ShortenedExperienceNameModalRegisterOptions.name.maxLength,
                    },
                  }}
                  helperText={
                    <Typography variant='subtitle2'>
                      {errors.name && errors.name.message ? (
                        translate(errors.name.message)
                      ) : (
                        <Fragment>
                          {editMode &&
                            `${translate('Label.CharacterCountLimit', {
                              count: field.value.length.toString(),
                              limit:
                                ShortenedExperienceNameModalRegisterOptions.name.maxLength.toString(),
                            })}. ${translate('Message.UniqueNames')}\n${translate(
                              'Message.AllowedSENCharacters',
                            )}`}
                        </Fragment>
                      )}
                    </Typography>
                  }
                />
              )}
            />
          </Grid>
          {editMode && (
            <Grid item XSmall={12}>
              <Controller
                name='confirmedName'
                control={control}
                rules={{
                  ...ShortenedExperienceNameModalRegisterOptions.confirmedName,
                  validate: (field) => {
                    return field?.trim() === name.trim() || 'Error.NamesDoNotMatch';
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    error={!!errors.confirmedName}
                    fullWidth
                    multiline
                    required
                    hidden={!editMode}
                    id='confirmedName'
                    label={translate('Heading.ConfirmSEN')}
                    inputProps={{
                      maxLength:
                        ShortenedExperienceNameModalRegisterOptions.confirmedName.maxLength,
                    }}
                    helperText={
                      <Typography variant='subtitle2'>
                        {errors.confirmedName && errors.confirmedName.message
                          ? translate(errors.confirmedName.message)
                          : translate('Label.NameCaseSensitive')}
                      </Typography>
                    }
                  />
                )}
              />
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Grid container direction='column' alignItems='center'>
          <Alert
            severity='warning'
            variant='outlined'
            sx={{
              border: 0,
            }}>
            <AlertTitle>{translate('Warning.CannotChangeSENAfterConfirmation')}</AlertTitle>
          </Alert>
          <Grid container direction='row' justifyContent='center' mt={2}>
            <Button
              variant='outlined'
              color='primary'
              onClick={onCancel}
              disabled={isSubmitting}
              size='large'>
              {translate('Action.Cancel')}
            </Button>
            <Button
              classes={{ root: createButton }}
              variant='contained'
              color='primaryBrand'
              onClick={handleSubmit(handleFormSubmit)}
              disabled={!isValidating && !isValid}
              size='large'
              loading={isSubmitting}>
              {translate('Action.Confirm')}
            </Button>
          </Grid>
        </Grid>
      </DialogActions>
    </>
  );
}

export default ShortenedExperienceNameModal;
