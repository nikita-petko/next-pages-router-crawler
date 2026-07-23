import { getResponseFromError } from '@modules/clients/utils';
import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { FormProvider } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Grid, Alert, useSnackbar, CircularProgress, Typography } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { Account } from '@modules/cloud-services/pricing/types';
import AccountSettingsForm from '@modules/cloud-services/pricing/components/AccountSettingsForm/AccountSettingsForm';
import BetaLabel from '@modules/cloud-services/pricing/components/BetaLabel/BetaLabel';
import useExtendedServicesAccountInfoQuery from '../../hooks/useExtendedServicesAccountInfoQuery';
import {
  useSubmitCreatorAccountInfo,
  useSubmitExtendedServicesAccountInfo,
} from '../../hooks/useSubmit';
import { defaultAccountInfo, InputFormData } from '../../types';
import useTabContentStyles from './TabContent.styles';
import AccountInfoFormInput from '../../components/form/AccountInfoFormInput';
import useFormMethods from '../../hooks/useFormMethods';
import useLatest from '../../hooks/useLatest';

import useCreatorAccountInfoQuery from '../../hooks/useCreatorAccountInfoQuery';

const CoreAccountInfoContent: FunctionComponent = () => {
  const { translate } = useTranslation();
  const { classes } = useTabContentStyles();
  const { enqueue: enqueueSnackbar } = useSnackbar();
  const submitCreatorAccountInfo = useSubmitCreatorAccountInfo();
  const submitExtendedServicesAccountInfo = useSubmitExtendedServicesAccountInfo();
  const queryClient = useQueryClient();

  const [creatorAccountInfoQuery, creatorAccountInfoQueryKey] = useCreatorAccountInfoQuery();
  const [resAccountInfoQuery, resAccountInfoQueryKey] = useExtendedServicesAccountInfoQuery();

  const accountInfo = useLatest(
    creatorAccountInfoQuery.data,
    () => creatorAccountInfoQuery.data !== undefined,
  );

  const resAccountInfo = useLatest(
    resAccountInfoQuery.data,
    () => resAccountInfoQuery.data !== undefined,
  ) as Account;

  const [extendedServicesAccountInfo, setExtendedServicesAccountInfo] =
    useState<Account>(resAccountInfo);
  const [originalESInfo, setOriginalESInfo] = useState<Account>(resAccountInfo);
  const [saveExtendedServices, setSaveExtendedServices] = useState<boolean>(false);
  const [isEsValid, setIsEsValid] = useState<boolean>(false);

  const getFormDefaultValues = useCallback(() => {
    return { accountInfo: accountInfo ?? defaultAccountInfo };
  }, [accountInfo]);

  const methods = useFormMethods({ defaultValues: getFormDefaultValues() });

  // If we have accountInfo but we are not saving extended services, set the initial state
  useEffect(() => {
    if (resAccountInfo && !saveExtendedServices) {
      setExtendedServicesAccountInfo(resAccountInfo);
      setOriginalESInfo(resAccountInfo);
    }
  }, [resAccountInfo, saveExtendedServices]);

  // Update form values when info is updated
  useEffect(() => {
    if (accountInfo) {
      methods.reset({ accountInfo }, { keepDefaultValues: false });
    }
  }, [accountInfo, methods]);

  // If the original account info does not match the saved account info, enable saving
  useEffect(() => {
    if (originalESInfo !== null && originalESInfo !== extendedServicesAccountInfo) {
      setSaveExtendedServices(true);
    } else {
      setSaveExtendedServices(false);
    }
  }, [extendedServicesAccountInfo, resAccountInfoQuery, originalESInfo]);

  const onSubmitOnlyES = useCallback(async () => {
    try {
      const response = await submitExtendedServicesAccountInfo({
        accountName: extendedServicesAccountInfo.accountName ?? '',
        accountTaxType: extendedServicesAccountInfo.accountTaxType,
        taxId: extendedServicesAccountInfo.taxId,
        taxIdType: extendedServicesAccountInfo.taxIdType,
      } as Account);
      queryClient.setQueryData(resAccountInfoQueryKey, response);
      if (response !== null) {
        setOriginalESInfo(response);
        setExtendedServicesAccountInfo(response);
        enqueueSnackbar({
          children: <Alert severity='success'>{translate('Message.AccountInfoUpdated')}</Alert>,
          anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
          autoHide: true,
        });
      }
    } catch {
      enqueueSnackbar({
        children: <Alert severity='error'>{translate('Message.FailedToUpdateAccountInfo')}</Alert>,
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
        autoHide: true,
      });
    } finally {
      setSaveExtendedServices(false);
      setIsEsValid(false);
    }
  }, [
    queryClient,
    enqueueSnackbar,
    translate,
    submitExtendedServicesAccountInfo,
    extendedServicesAccountInfo,
    resAccountInfoQueryKey,
  ]);

  const onSubmit = useCallback(
    async (data: InputFormData) => {
      try {
        if (saveExtendedServices && extendedServicesAccountInfo) {
          const response = await submitExtendedServicesAccountInfo({
            accountName: extendedServicesAccountInfo.accountName ?? '',
            accountTaxType: extendedServicesAccountInfo.accountTaxType,
            taxId: extendedServicesAccountInfo.taxId,
            taxIdType: extendedServicesAccountInfo.taxIdType,
          } as Account);

          queryClient.setQueryData(resAccountInfoQueryKey, response);
          if (response !== null) {
            setOriginalESInfo(response);
            setExtendedServicesAccountInfo(response);
          }
        }

        const updatedAccountInfo = await submitCreatorAccountInfo(data);
        queryClient.setQueryData(creatorAccountInfoQueryKey, updatedAccountInfo);
        methods.reset({ accountInfo: updatedAccountInfo }, { keepDefaultValues: false });
        enqueueSnackbar({
          children: <Alert severity='success'>{translate('Message.AccountInfoUpdated')}</Alert>,
          anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
          autoHide: true,
        });
      } catch {
        enqueueSnackbar({
          children: (
            <Alert severity='error'>{translate('Message.FailedToUpdateAccountInfo')}</Alert>
          ),
          anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
          autoHide: true,
        });
      } finally {
        setSaveExtendedServices(false);
        setIsEsValid(false);
      }
    },
    [
      submitCreatorAccountInfo,
      queryClient,
      creatorAccountInfoQueryKey,
      methods,
      enqueueSnackbar,
      translate,
      saveExtendedServices,
      submitExtendedServicesAccountInfo,
      extendedServicesAccountInfo,
      resAccountInfoQueryKey,
    ],
  );

  const onCancel = useCallback(() => {
    methods.reset();
    setSaveExtendedServices(false);
    setExtendedServicesAccountInfo(originalESInfo);
    setIsEsValid(false);
  }, [methods, originalESInfo, setExtendedServicesAccountInfo]);

  if (!accountInfo && creatorAccountInfoQuery.error) {
    const isForbidden = creatorAccountInfoQuery.isSuccess
      ? false
      : getResponseFromError(creatorAccountInfoQuery.error)?.status === 403;

    if (isForbidden) {
      return <Alert severity='warning'>{translate('Message.PermissionsError')}</Alert>;
    }

    return <Alert severity='error'>{translate('Message.GenericError')}</Alert>;
  }

  if (accountInfo === undefined || (resAccountInfo === undefined && !resAccountInfoQuery.error)) {
    return (
      <Grid container width='100%' justifyContent='center' alignItems='center' minHeight={360}>
        <CircularProgress color='secondary' />
      </Grid>
    );
  }

  const displayExtendedServices =
    (resAccountInfo && resAccountInfo !== null) || extendedServicesAccountInfo;

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent the default form submission behavior

    if (!(methods.formState.isSubmitting || !methods.formState.isDirty)) {
      await methods.handleSubmit(onSubmit)();
    } else {
      await onSubmitOnlyES();
    }
  };

  return (
    <div>
      <FormProvider {...methods}>
        <form onSubmit={handleFormSubmit} noValidate>
          <Grid container width='100%' direction='column' gap={3} className={classes.container}>
            <AccountInfoFormInput />
            {displayExtendedServices && (
              <Grid item container direction='column' gap={2}>
                <Grid item direction='column' gap={3} marginTop={0.25} marginBottom={0.5}>
                  <Typography variant='h6' color='primary'>
                    Extended Services
                  </Typography>
                  <BetaLabel text='Beta' />
                </Grid>
                <Grid item>
                  <AccountSettingsForm
                    isEditing
                    newAccountValues={extendedServicesAccountInfo ?? resAccountInfo}
                    setNewAccountValues={setExtendedServicesAccountInfo}
                    setIsFormValid={setIsEsValid}
                  />
                </Grid>
              </Grid>
            )}
            <Grid item container gap={1.5} className={classes.buttonContainer}>
              <Grid item>
                <Button
                  variant='outlined'
                  color='secondary'
                  size='large'
                  type='button'
                  disabled={
                    (methods.formState.isSubmitting || !methods.formState.isDirty) &&
                    !(saveExtendedServices && isEsValid)
                  }
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
                  disabled={
                    (methods.formState.isSubmitting || !methods.formState.isDirty) &&
                    !(saveExtendedServices && isEsValid)
                  }>
                  {translate('Action.Update')}
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </form>
      </FormProvider>
    </div>
  );
};

export default withTranslation(CoreAccountInfoContent, [TranslationNamespace.CreatorAccount]);
