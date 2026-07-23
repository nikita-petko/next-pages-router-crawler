import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { FormProvider } from 'react-hook-form';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Button, Grid, Alert, useSnackbar, CircularProgress } from '@rbx/ui';
import { CreatorContactType } from '@modules/clients/brandPlatform';
import { getResponseFromError } from '@modules/clients/utils';
import useCountries from '@modules/commerce/hooks/useCountries';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import InvoicingContactFormInput from '../../components/form/InvoicingContactFormInput';
import useCreatorContactInfoQuery from '../../hooks/useCreatorContactInfoQuery';
import useFormMethods from '../../hooks/useFormMethods';
import useLatest from '../../hooks/useLatest';
import { useSubmitCreatorContact } from '../../hooks/useSubmit';
import type { InputFormData } from '../../types';
import { defaultContactInfo } from '../../types';
import useTabContentStyles from './TabContent.styles';

const InvoicingContent = () => {
  const { translate } = useTranslation();
  const { classes } = useTabContentStyles();
  const { enqueue: enqueueSnackbar } = useSnackbar();
  const submitCreatorContact = useSubmitCreatorContact(CreatorContactType.Invoicing);
  const queryClient = useQueryClient();
  const { countries, ...countriesQuery } = useCountries();

  // Fetch existing invoicing info
  const [creatorInvoicingContactInfoQuery, creatorInvoicingContactInfoQueryKey] =
    useCreatorContactInfoQuery(CreatorContactType.Invoicing);
  const invoicingInfo = useLatest(
    creatorInvoicingContactInfoQuery.data,
    () => creatorInvoicingContactInfoQuery.data !== undefined,
  );

  // Fetch legal address info for the "same as legal address" feature
  const [creatorLegalContactInfoQuery] = useCreatorContactInfoQuery(CreatorContactType.Legal);
  const legalInfo = useLatest(
    creatorLegalContactInfoQuery.data,
    () => creatorLegalContactInfoQuery.data !== undefined,
  );

  const getFormDefaultValues = useCallback(() => {
    return { contactInfo: invoicingInfo ?? defaultContactInfo };
  }, [invoicingInfo]);

  const methods = useFormMethods({ defaultValues: getFormDefaultValues() });

  // Update form values when info is updated
  useEffect(() => {
    if (invoicingInfo) {
      methods.reset({ contactInfo: invoicingInfo }, { keepDefaultValues: false });
    }
  }, [invoicingInfo, methods]);

  const onSubmit = useCallback(
    async (data: InputFormData) => {
      try {
        const updatedContact = await submitCreatorContact(data);
        queryClient.setQueryData(creatorInvoicingContactInfoQueryKey, updatedContact);
        methods.reset({ contactInfo: updatedContact }, { keepDefaultValues: false });
        enqueueSnackbar({
          children: <Alert severity='success'>{translate('Message.InvoicingInfoUpdated')}</Alert>,
          anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
          autoHide: true,
        });
      } catch {
        enqueueSnackbar({
          children: (
            <Alert severity='error'>{translate('Message.FailedToUpdateInvoicingInfo')}</Alert>
          ),
          anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
          autoHide: true,
        });
      }
    },
    [
      submitCreatorContact,
      queryClient,
      creatorInvoicingContactInfoQueryKey,
      methods,
      enqueueSnackbar,
      translate,
    ],
  );

  const onCancel = useCallback(() => {
    methods.reset();
  }, [methods]);

  if (
    (!invoicingInfo && creatorInvoicingContactInfoQuery.error) ||
    (!legalInfo && creatorLegalContactInfoQuery.error) ||
    (countries.length === 0 && countriesQuery.error)
  ) {
    const isInvoicingInfoForbidden = creatorInvoicingContactInfoQuery.isSuccess
      ? false
      : getResponseFromError(creatorInvoicingContactInfoQuery.error)?.status === 403;
    const isLegalInfoForbidden = creatorLegalContactInfoQuery.isSuccess
      ? false
      : getResponseFromError(creatorLegalContactInfoQuery.error)?.status === 403;

    if (isInvoicingInfoForbidden || isLegalInfoForbidden) {
      return <Alert severity='warning'>{translate('Message.PermissionsError')}</Alert>;
    }

    return <Alert severity='error'>{translate('Message.GenericError')}</Alert>;
  }

  if (invoicingInfo === undefined || legalInfo === undefined || countriesQuery.isPending) {
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
          <InvoicingContactFormInput
            countries={countries}
            legalContactInfo={legalInfo}
            hideCheckbox={!!invoicingInfo}
          />
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

export default withTranslation(InvoicingContent, [TranslationNamespace.CreatorAccount]);
