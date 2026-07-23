import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormHelperText,
  makeStyles,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { CancellationReason } from '@rbx/clients/contentLicensingApi/v1';

const useStyles = makeStyles()(() => ({
  helperText: {
    minHeight: 24,
  },
}));

export interface CreatorCancelAgreementFormData {
  reason: CancellationReason | '';
}

interface CreatorCancelAgreementModalProps {
  isInquiredAgreement: boolean;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: CancellationReason) => Promise<void>;
  isLoading?: boolean;
  isTimeLimitedLicense?: boolean;
}

const CreatorCancelAgreementModal: React.FC<CreatorCancelAgreementModalProps> = ({
  isInquiredAgreement,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  isTimeLimitedLicense = false,
}) => {
  const { translate } = useTranslation();
  const { classes } = useStyles();

  const methods = useForm<CreatorCancelAgreementFormData>({
    defaultValues: { reason: '' },
  });

  const { control, handleSubmit, reset } = methods;

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: CreatorCancelAgreementFormData) => {
    await onConfirm(data.reason as CancellationReason);
  };

  const isSubmitting = isLoading;

  return (
    <Dialog open={isOpen} onClose={handleClose}>
      <DialogTitle>
        {isInquiredAgreement
          ? translate('Action.CancelLicenseRequest')
          : translate('Action.CancelAgreement')}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          {isInquiredAgreement
            ? translate('Description.CancelLicenseRequest')
            : translate('Description.CancelAgreement')}
        </DialogContentText>
      </DialogContent>

      <DialogContent>
        <FormProvider {...methods}>
          <DialogContentText gutterBottom>
            <Typography variant='h6' color='primary'>
              {translate('Header.CancellationReason')}
            </Typography>
          </DialogContentText>

          <Controller
            name='reason'
            control={control}
            rules={{ required: translate('Label.FieldIsRequired') }}
            render={({ field, fieldState: { error } }) => (
              <React.Fragment>
                <RadioGroup {...field}>
                  <FormControlLabel
                    value={CancellationReason.NoLongerPlanningToUseIp}
                    control={<Radio aria-label={translate('Label.NoLongerInterested')} />}
                    label={
                      <Typography variant='body1' color='secondary'>
                        {translate('Label.NoLongerInterested')}
                      </Typography>
                    }
                  />
                  {isTimeLimitedLicense && (
                    <FormControlLabel
                      value={CancellationReason.NotReadyForProposedDates}
                      control={<Radio aria-label={translate('Label.NotReadyByProposedDates')} />}
                      label={
                        <Typography variant='body1' color='secondary'>
                          {translate('Label.NotReadyByProposedDates')}
                        </Typography>
                      }
                    />
                  )}
                </RadioGroup>
                <div className={classes.helperText}>
                  <FormHelperText error>{error ? error.message : ''}</FormHelperText>
                </div>
              </React.Fragment>
            )}
          />
        </FormProvider>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} variant='contained' color='secondary' disabled={isSubmitting}>
          {translate('Action.Cancel')}
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          loading={isSubmitting}
          variant='contained'
          color='destructive'>
          {isInquiredAgreement
            ? translate('Action.ConfirmCancelRequest')
            : translate('Action.ConfirmCancelAgreement')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreatorCancelAgreementModal;
