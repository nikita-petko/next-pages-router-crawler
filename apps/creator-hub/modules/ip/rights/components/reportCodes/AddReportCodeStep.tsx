import type { FunctionComponent } from 'react';
import { useCallback, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, TextField, Typography } from '@rbx/ui';
import rightsClient from '@modules/clients/rights';
import { PageLoading } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import ApplyFooter from '../registration/ApplyFooter';

export interface AddReportCodeStepProps {
  onNext: (viewId: string) => void;
  onBack: () => void;
}

interface AddReportCodeFormValues {
  reportCode: string;
}

// Requires TranslationNamespace.RightsPortal provider
const AddReportCodeStep: FunctionComponent<AddReportCodeStepProps> = ({ onNext, onBack }) => {
  const { ready, translate } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const formMethods = useForm<AddReportCodeFormValues>({
    defaultValues: {
      reportCode: '',
    },
    mode: 'onChange',
  });

  const handleNext = useCallback(
    async (formData: AddReportCodeFormValues) => {
      const code = formData.reportCode.trim().toUpperCase();
      setIsLoading(true);
      formMethods.clearErrors('reportCode');
      try {
        const prepareResponse = await rightsClient.prepareSnapshotView(code);
        const viewId = prepareResponse.id;
        if (!viewId) {
          formMethods.setError('reportCode', {
            type: 'manual',
            message: translate('Error.ReportCodeInvalid'),
          });
          return;
        }
        onNext(viewId);
      } catch {
        formMethods.setError('reportCode', {
          type: 'manual',
          message: translate('Error.ReportCodeInvalid'),
        });
      } finally {
        setIsLoading(false);
      }
    },
    [onNext, formMethods, translate],
  );

  if (!ready) {
    return <PageLoading />;
  }

  return (
    <FormProvider {...formMethods}>
      <Grid container direction='column' width='70%' spacing={2}>
        <Grid item>
          <Typography variant='h5' component='h2'>
            {translate('Label.ReportCodeRequired')}
          </Typography>
        </Grid>
        <Grid item>
          <TextField
            id='report-code-field'
            label=''
            sx={{ width: '100%' }}
            error={!!formMethods.formState.errors.reportCode}
            helperText={formMethods.formState.errors.reportCode?.message}
            {...formMethods.register('reportCode', {
              validate: (value) => value.trim().length === 6 || translate('Error.ReportCodeLength'),
            })}
          />
        </Grid>
        <Grid item>
          <ApplyFooter
            primaryLabel={translate('Label.Next')}
            primaryEnabled={formMethods.formState.isValid && !isLoading}
            secondaryLabel={translate('Label.Cancel')}
            isLoading={isLoading}
            onNext={formMethods.handleSubmit(handleNext)}
            onBack={onBack}
          />
        </Grid>
      </Grid>
    </FormProvider>
  );
};

export default withTranslation(AddReportCodeStep, [TranslationNamespace.RightsPortal]);
