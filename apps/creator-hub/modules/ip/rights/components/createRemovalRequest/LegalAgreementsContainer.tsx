import type { FunctionComponent } from 'react';
import React, { useState, useCallback } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, Typography, TextField } from '@rbx/ui';
import LegalAgreements from '@modules/legal-agreements/components/LegalAgreements';
import { FormMode } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import ApplyFooter from '../registration/ApplyFooter';

interface LegalAgreementsContainerProps {
  onClickBack: () => void;
  onClickNext: () => void;
  requestName: string;
  setRequestName: (name: string) => void;
  isLoading: boolean;
  isClaimsEnabled: boolean;
}

const LegalAgreementsContainer: FunctionComponent<
  React.PropsWithChildren<LegalAgreementsContainerProps>
> = ({ onClickBack, onClickNext, requestName, setRequestName, isLoading, isClaimsEnabled }) => {
  const { ready, translate } = useTranslation();
  const legalStatements = [
    {
      text: translate('Description.FirstLegalStatement'),
      id: 'first',
    },
    {
      text: translate('Description.SecondLegalStatement'),
      id: 'second',
    },
  ];

  const [legalAgreementsCompleted, setLegalAgreementsCompleted] = useState(false);

  const onRequestNameChanged = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setRequestName(e.target.value);
    },
    [setRequestName],
  );

  const formMethods = useForm({
    mode: FormMode.OnChange,
    reValidateMode: FormMode.OnChange,
    shouldUnregister: true,
  });

  if (!ready) {
    return null;
  }

  return (
    <FormProvider {...formMethods}>
      <Grid container direction='column' width='70%' spacing={2}>
        <Grid item container direction='column' spacing={3}>
          <Grid item container direction='column' spacing={3}>
            <Grid item>
              <Typography variant='h5'>{translate('Heading.General')}</Typography>
            </Grid>
            <Grid item container>
              <TextField
                id='request-name-field'
                label={translate('Label.RequestName')}
                sx={{ width: '100%' }}
                onChange={onRequestNameChanged}
                value={requestName}
                helperText={translate('Description.RequestName')}
              />
            </Grid>
          </Grid>
          <Grid item container direction='column' spacing={1}>
            <Grid item>
              <Typography variant='h5'>{translate('Heading.LegalAgreements')}*</Typography>
            </Grid>
            <Grid item container direction='column' spacing={3}>
              <LegalAgreements
                isSignatureRequired
                legalStatements={legalStatements}
                onFormUpdate={(isAllAgreementsComplete) => {
                  setLegalAgreementsCompleted(isAllAgreementsComplete);
                }}
                statementSpacing={1}
                signatureWidth='100%'
              />
            </Grid>
          </Grid>
        </Grid>
        <Grid item XSmall='auto'>
          <ApplyFooter
            primaryLabel={
              isClaimsEnabled ? translate('Label.SubmitClaim') : translate('Label.SubmitForReview')
            }
            primaryEnabled={legalAgreementsCompleted}
            secondaryLabel={translate('Label.Back')}
            onNext={onClickNext}
            onBack={onClickBack}
            isLoading={isLoading}
          />
        </Grid>
      </Grid>
    </FormProvider>
  );
};

export default withTranslation(LegalAgreementsContainer, [TranslationNamespace.RightsPortal]);
