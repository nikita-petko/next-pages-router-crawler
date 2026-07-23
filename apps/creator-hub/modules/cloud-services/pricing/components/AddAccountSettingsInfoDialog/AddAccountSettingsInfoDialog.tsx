import type { FunctionComponent } from 'react';
import { useCallback, useState, useMemo, Fragment } from 'react';
import { AccountTaxType } from '@rbx/client-service-efficiency-api/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Button, Grid, Dialog, DialogContent, Divider, Typography } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import type { Account } from '../../types';
import AccountSettingsForm from '../AccountSettingsForm/AccountSettingsForm';
import useAddAccountSettingsInfoDialogStyles from './AddAccountSettingsInfoDialog.styles';

export interface AddAccountSettingsInfoDialogProps {
  forStep: boolean;
  saveAccountResponse: (accountInfo: Account) => void;
  closeDialog: () => void;
}

const AddAccountSettingsInfoDialog: FunctionComponent<AddAccountSettingsInfoDialogProps> = ({
  forStep,
  saveAccountResponse,
  closeDialog,
}) => {
  const {
    classes: {
      bottomDivider,
      buttonContainer,
      saveButton,
      cancelButton,
      accountDescription,
      topDivider,
    },
  } = useAddAccountSettingsInfoDialogStyles();

  const emptyAccountValue = {
    accountTaxType: AccountTaxType.Individual,
    accountName: '',
    taxId: undefined,
    taxIdType: undefined,
  } as Account;

  const [newAccountValues, setNewAccountValues] = useState<Account>(emptyAccountValue);
  const [isFormValid, setIsFormValid] = useState(false);
  const { translate } = useTranslationWrapper(useTranslation());

  const closeAccDialog = useCallback(() => {
    closeDialog();
  }, [closeDialog]);

  const accountSettingsForm = useMemo(
    () => (
      <>
        {!forStep && (
          <Grid container XSmall={12}>
            <Grid item XSmall={12}>
              <Typography variant='h5'>
                {translate(
                  translationKey('Label.AddAccountInfo', TranslationNamespace.CloudServices),
                )}
              </Typography>
            </Grid>
            <Grid item XSmall={12}>
              <Divider className={topDivider} />
            </Grid>
          </Grid>
        )}
        <Grid container direction='column'>
          <Grid item>
            <Typography variant='h6'>
              {translate(
                translationKey(
                  'Heading.AccountInformationTitle',
                  TranslationNamespace.CloudServices,
                ),
              )}
            </Typography>
          </Grid>
          <Grid item className={accountDescription}>
            <Typography variant='body2' color='secondary'>
              {translate(
                translationKey(
                  'Description.AccountInformation',
                  TranslationNamespace.CloudServices,
                ),
              )}
            </Typography>
          </Grid>
        </Grid>
        <AccountSettingsForm
          isEditing
          newAccountValues={newAccountValues}
          setNewAccountValues={setNewAccountValues}
          setIsFormValid={setIsFormValid}
        />
        <Divider className={bottomDivider} />
        <Grid container justifyContent='flex-end' className={buttonContainer}>
          <Button
            className={cancelButton}
            color='secondary'
            size='medium'
            variant='contained'
            onClick={closeAccDialog}>
            {translate(translationKey('Label.Cancel', TranslationNamespace.CloudServices))}
          </Button>
          <Button
            className={saveButton}
            color='primaryBrand'
            size='medium'
            variant='contained'
            disabled={!isFormValid || newAccountValues.accountName === ''}
            onClick={() => saveAccountResponse(newAccountValues)}>
            {!forStep
              ? translate(translationKey('Label.SaveChanges', TranslationNamespace.CloudServices))
              : translate(translationKey('Label.NextStepper', TranslationNamespace.CloudServices))}
          </Button>
        </Grid>
      </>
    ),
    [
      accountDescription,
      bottomDivider,
      buttonContainer,
      cancelButton,
      closeAccDialog,
      isFormValid,
      newAccountValues,
      saveAccountResponse,
      forStep,
      topDivider,
      saveButton,
      translate,
    ],
  );

  // If this is not for the stepper, then we will use the dialog version.
  if (!forStep) {
    return (
      <Dialog open scroll='body' onClose={saveAccountResponse} fullWidth maxWidth='Large'>
        <DialogContent>{accountSettingsForm}</DialogContent>
      </Dialog>
    );
  }

  return accountSettingsForm;
};

export default withTranslation(AddAccountSettingsInfoDialog, [TranslationNamespace.CloudServices]);
