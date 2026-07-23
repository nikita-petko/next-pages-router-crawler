import { useCallback } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from '@rbx/intl';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Link,
  TextField,
} from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import { FormMode } from '@modules/miscellaneous/common';
import { useCreatePayoutAccount } from '@modules/react-query/fiatPaidAccess/fiatPaidAccessQueries';
import { supportLink } from '../../constants/links';
import { NAME_PATTERN, MAX_NAME_LENGTH } from '../../constants/PaymentSetupModalConstants';
import usePaymentSetupModalStyles from './PaymentSetupModal.styles';

interface PaymentSetupModalProps {
  emailAddress: string;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  modalSubmitted: () => void;
  handleError: () => void;
}

interface PaymentSetupFormData {
  name: string;
  email: string;
}

const PaymentSetupModal = ({
  emailAddress,
  isOpen,
  setOpen,
  modalSubmitted,
  handleError,
}: PaymentSetupModalProps) => {
  const { translate, translateHTML } = useTranslation();
  const { classes } = usePaymentSetupModalStyles();
  const { control, handleSubmit, formState } = useForm<PaymentSetupFormData>({
    mode: FormMode.OnTouched,
    reValidateMode: FormMode.OnChange,
    shouldUnregister: true,
    defaultValues: {
      name: '',
      email: '',
    },
  });
  const { isValid, isValidating } = formState;
  const { user } = useAuthentication();
  const { mutateAsync: createPayoutAccount } = useCreatePayoutAccount();

  const SetupModalOptions = {
    name: {
      required: translate('Error.FieldRequired'),
      maxLength: MAX_NAME_LENGTH,
    },
  };

  const validateFullName = (value: string): boolean | string => {
    return NAME_PATTERN.test(value) || translate('Label.NamePrompt');
  };

  const onButtonSubmit: SubmitHandler<PaymentSetupFormData> = useCallback(
    async (data) => {
      try {
        await createPayoutAccount({
          userId: user!.id,
          fullName: data.name,
        });
        modalSubmitted();
        setOpen(false);
      } catch {
        handleError();
      }
    },
    [createPayoutAccount, handleError, modalSubmitted, setOpen, user],
  );

  const closeModal = () => {
    setOpen(false);
  };

  const submitInfo = useCallback(() => {
    handleSubmit(onButtonSubmit)();
  }, [handleSubmit, onButtonSubmit]);

  return (
    <Dialog maxWidth='Medium' fullWidth open={isOpen} onClose={() => setOpen(false)}>
      <DialogTitle>{translate('Title.PaymentInformation')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {translateHTML('Description.PaymentSetup', [
            {
              opening: 'supportLinkStart',
              closing: 'supportLinkEnd',
              content(chunk) {
                return (
                  <Link href={supportLink} target='_blank'>
                    {chunk}
                  </Link>
                );
              },
            },
          ])}
        </DialogContentText>
        <Grid container item className={classes.grid}>
          <Grid item className={classes.gridItem}>
            <Controller
              name='name'
              control={control}
              rules={{
                required: SetupModalOptions.name.required,
                maxLength: {
                  value: SetupModalOptions.name.maxLength,
                  message: translate('Label.MaximumNameLimit', {
                    limit: SetupModalOptions.name.maxLength.toString(),
                  }),
                },
                validate: validateFullName,
              }}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  spellCheck={false}
                  fullWidth
                  required
                  id='namefield'
                  label={translate('Label.FullName')}
                  helperText={error?.message || translate('Label.LegalNameRequired')}
                  error={!!error}
                />
              )}
            />
          </Grid>
          <Grid item className={classes.gridItem}>
            <Controller
              name='email'
              control={control}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  fullWidth
                  disabled
                  id='emailfield'
                  label={emailAddress}
                  error={!!error}
                />
              )}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button color='secondary' size='large' variant='outlined' onClick={closeModal}>
          {translate('Action.Cancel')}
        </Button>
        <Button
          color='primaryBrand'
          size='large'
          variant='contained'
          onClick={submitInfo}
          disabled={!isValidating && !isValid}>
          {translate('Label.SendRequest')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentSetupModal;
