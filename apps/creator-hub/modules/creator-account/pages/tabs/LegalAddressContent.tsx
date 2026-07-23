import { getResponseFromError } from '@modules/clients/utils';
import React, { FunctionComponent, useCallback, useEffect } from 'react';
import { FormProvider } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Grid, Alert, useSnackbar, CircularProgress } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useCountries from '@modules/commerce/hooks/useCountries';
import { CreatorContactType } from '@modules/clients/brandPlatform';
import { useSubmitCreatorContact } from '../../hooks/useSubmit';
import { defaultContactInfo, InputFormData } from '../../types';
import useTabContentStyles from './TabContent.styles';
import LegalContactFormInput from '../../components/form/LegalContactFormInput';
import useFormMethods from '../../hooks/useFormMethods';
import useLatest from '../../hooks/useLatest';
import useCreatorContactInfoQuery from '../../hooks/useCreatorContactInfoQuery';

const LegalAddressContent: FunctionComponent = () => {
  const { translate } = useTranslation();
  const { classes } = useTabContentStyles();
  const { enqueue: enqueueSnackbar } = useSnackbar();
  const submitCreatorContact = useSubmitCreatorContact(CreatorContactType.Legal);
  const queryClient = useQueryClient();
  const { countries, ...countriesQuery } = useCountries();

  // TODO: only show submit if changed

  // Fetch existing legal address info
  const [creatorLegalContactInfoQuery, creatorLegalContactInfoQueryKey] =
    useCreatorContactInfoQuery(CreatorContactType.Legal);
  const legalInfo = useLatest(
    creatorLegalContactInfoQuery.data,
    () => creatorLegalContactInfoQuery.data !== undefined,
  );

  const getFormDefaultValues = useCallback(() => {
    return { contactInfo: legalInfo ?? defaultContactInfo };
  }, [legalInfo]);

  const methods = useFormMethods({ defaultValues: getFormDefaultValues() });

  // Update form values when info is updated
  useEffect(() => {
    if (legalInfo) {
      methods.reset({ contactInfo: legalInfo }, { keepDefaultValues: false });
    }
  }, [legalInfo, methods]);

  const onSubmit = useCallback(
    async (data: InputFormData) => {
      try {
        const updatedContact = await submitCreatorContact(data);
        queryClient.setQueryData(creatorLegalContactInfoQueryKey, updatedContact);
        methods.reset({ contactInfo: updatedContact }, { keepDefaultValues: false });
        enqueueSnackbar({
          children: <Alert severity='success'>{translate('Message.LegalAddressUpdated')}</Alert>,
          anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
          autoHide: true,
        });
      } catch {
        enqueueSnackbar({
          children: (
            <Alert severity='error'>{translate('Message.FailedToUpdateLegalAddress')}</Alert>
          ),
          anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
          autoHide: true,
        });
      }
    },
    [
      submitCreatorContact,
      queryClient,
      creatorLegalContactInfoQueryKey,
      methods,
      enqueueSnackbar,
      translate,
    ],
  );

  const onCancel = useCallback(() => {
    methods.reset();
  }, [methods]);

  if (
    (!legalInfo && creatorLegalContactInfoQuery.error) ||
    (countries.length === 0 && countriesQuery.error)
  ) {
    const isForbidden = creatorLegalContactInfoQuery.isSuccess
      ? false
      : getResponseFromError(creatorLegalContactInfoQuery.error)?.status === 403;

    if (isForbidden) {
      return <Alert severity='warning'>{translate('Message.PermissionsError')}</Alert>;
    }

    return <Alert severity='error'>{translate('Message.GenericError')}</Alert>;
  }

  if (legalInfo === undefined || countriesQuery.isPending) {
    return (
      <Grid container width='100%' justifyContent='center' alignItems='center' minHeight={360}>
        <CircularProgress color='secondary' />
      </Grid>
    );
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Grid container width='100%' direction='column' gap={3} className={classes.container}>
          <LegalContactFormInput countries={countries} />
          <Grid item container gap={1.5} className={classes.buttonContainer}>
            <Grid item>
              <Button
                variant='outlined'
                color='secondary'
                size='large'
                type='button'
                disabled={methods.formState.isSubmitting || !methods.formState.isDirty}
                onClick={onCancel}>
                {translate('Action.Cancel')}
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant='contained'
                size='large'
                type='submit'
                loading={methods.formState.isSubmitting}
                disabled={methods.formState.isSubmitting || !methods.formState.isDirty}>
                {translate('Action.Update')}
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </form>
    </FormProvider>
  );
};

export default withTranslation(LegalAddressContent, [TranslationNamespace.CreatorAccount]);
