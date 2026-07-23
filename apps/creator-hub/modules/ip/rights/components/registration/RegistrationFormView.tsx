import React, { useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { AccountAccountTypeEnum } from '@rbx/client-rights/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, Typography, useTheme } from '@rbx/ui';
import { FormMode } from '@modules/miscellaneous/common';
import { PageLoading } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import ErrorType from '../../enums/ErrorType';
import useScrollRef from '../../helpers/useScrollRef';
import useCountryList from '../../hooks/useCountryList';
import type RightsAccountFormType from '../../types/RightsAccountFormType';
import { ACCOUNT_HREF } from '../../urls';
import DocumentForm from '../documents/DocumentForm';
import RightsApiErrorView from '../error/RightsApiErrorView';
import ApplyFooter from './ApplyFooter';
import AddressForm from './RegistrationFormContent/AddressForm';
import LegalForm from './RegistrationFormContent/LegalForm';
import RightsHolderForm from './RegistrationFormContent/RightsHolderForm';
import SubmitDialog from './SubmitDialog';

export interface RegistrationFormViewProps {
  defaults?: RightsAccountFormType;
  stepper?: React.ReactNode;
  onBack: () => void;
  customBackLabel?: string; // exit the from, in the apply footer
  hideTitle?: boolean;
}

// RegistrationFormView displays the second step of registration
const RegistrationFormView = ({
  stepper,
  onBack,
  defaults,
  customBackLabel,
  hideTitle = false,
}: RegistrationFormViewProps) => {
  const theme = useTheme();
  const { ready, translate } = useTranslation();
  const { countries, isPending, error } = useCountryList();

  const [isDialogOpen, setDialogOpen] = useState(false);
  const formMethods = useForm<RightsAccountFormType>({
    mode: FormMode.OnChange,
    reValidateMode: FormMode.OnChange,
    defaultValues: defaults || {
      documents: [],
      country: { name: '' },
      address2: '',
    },
    shouldUnregister: false,
  });
  const { handleSubmit, control, formState } = formMethods;
  const { accountType } = useWatch({ control });
  const { scrollRef } = useScrollRef();
  if (isPending || !ready) {
    return <PageLoading />;
  }
  if (error) {
    return <RightsApiErrorView errorType={ErrorType.ServerError} />;
  }
  return (
    <FormProvider {...formMethods}>
      <Grid data-testid='registration-form' container direction='column'>
        {stepper && (
          <Grid
            item
            container
            direction='column'
            spacing={5}
            paddingBottom={3} // 5 padding for the first element, but 3 while scrolling.
            sx={{
              top: '60px',
              backgroundColor: theme.palette.surface[0],
              zIndex: '2',
            }}>
            {!hideTitle && (
              <Grid item container direction='column'>
                <Typography variant='h1'>{translate('Heading.Registration')}</Typography>
              </Grid>
            )}
            <Grid item>{stepper}</Grid>
          </Grid>
        )}
        <Grid item container direction='column' spacing={7} width='60%'>
          <Grid item>
            <RightsHolderForm accountType={accountType} />
          </Grid>
          <Grid item>
            <AddressForm countries={countries} />
          </Grid>
          {accountType === AccountAccountTypeEnum.Corporate && (
            <Grid item>
              <DocumentForm />
            </Grid>
          )}
          <Grid item>
            <LegalForm />
          </Grid>
        </Grid>
        <Grid item paddingRight={5} paddingTop={5}>
          <ApplyFooter
            primaryLabel={translate('Label.SubmitForReview')}
            primaryEnabled={formState.isValid}
            secondaryLabel={customBackLabel || translate('Label.Back')}
            onNext={() => setDialogOpen(true)}
            onBack={() => {
              scrollRef?.scrollTo(0, 0);
              onBack();
            }}
          />
        </Grid>
        <SubmitDialog
          open={isDialogOpen}
          onClose={() => {
            setDialogOpen(false);
          }}
          handleSubmit={handleSubmit}
          onSuccess={() => {
            window.location.href = ACCOUNT_HREF;
          }}
        />
      </Grid>
    </FormProvider>
  );
};

export default withTranslation(RegistrationFormView, [TranslationNamespace.RightsPortal]);
