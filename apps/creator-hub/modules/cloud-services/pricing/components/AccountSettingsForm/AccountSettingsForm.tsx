import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { Grid, TextField, Select, MenuItem } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { useTranslationWrapper, translationKey } from '@modules/analytics-translations';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import {
  Account,
  TaxIdType,
  AccountTaxType,
  taxIdTypeToTranslationKey,
  accountTaxTypeToTranslationKey,
} from '../../types';

interface AccountSettingsFormProps {
  isEditing: boolean;
  newAccountValues: Account;
  setNewAccountValues: React.Dispatch<React.SetStateAction<Account>>;
  setIsFormValid: (isValid: boolean) => void;
}

const AccountSettingsForm: FunctionComponent<AccountSettingsFormProps> = ({
  isEditing,
  newAccountValues,
  setNewAccountValues,
  setIsFormValid,
}) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const [accNameError, setAccNameError] = useState(false);
  const [taxIdError, setTaxIdError] = useState(false);
  const [taxIdTypeError, setTaxIdTypeError] = useState(false);

  useEffect(() => {
    if (newAccountValues) {
      if (!newAccountValues.accountName || newAccountValues.accountName === null) {
        setAccNameError(true);
      } else if (newAccountValues.accountName.length > 70) {
        setAccNameError(true);
      } else if (newAccountValues.accountName.length <= 0) {
        setAccNameError(true);
      } else {
        setAccNameError(false);
      }

      if (!newAccountValues.taxIdType && newAccountValues.taxId) {
        setTaxIdTypeError(true);
      } else if (
        newAccountValues.taxIdType &&
        newAccountValues.taxIdType !== TaxIdType.Invalid &&
        !newAccountValues.taxId
      ) {
        setTaxIdTypeError(true);
      } else {
        setTaxIdTypeError(false);
      }
    }
  }, [newAccountValues]);

  const changeAccountType = useCallback(
    (accountTaxType: AccountTaxType) => {
      setNewAccountValues((prevValues) => ({
        ...prevValues,
        accountTaxType,
      }));
    },
    [setNewAccountValues],
  );
  const changeAccountName = useCallback(
    (accountName: string) => {
      setNewAccountValues((prevValues) => ({
        ...prevValues,
        accountName,
      }));
      if (accountName === null || accountName === undefined) {
        setAccNameError(true);
      } else if (accountName.length > 70) {
        setAccNameError(true);
      } else if (accountName.length <= 0) {
        setAccNameError(true);
      } else {
        setAccNameError(false);
      }
    },
    [setNewAccountValues],
  );

  const changeTaxId = useCallback(
    (taxId?: string) => {
      setTaxIdTypeError(false); // Everytime we change either taxId or taxIdType we reset this error and check again
      setNewAccountValues((prevValues) => ({
        ...prevValues,
        taxId,
      }));
      if (taxId && taxId.length > 128) {
        setTaxIdError(true);
      }
      // If taxIdType is not invalid or null, we will show an error if the taxId is empty
      else if (!newAccountValues.taxIdType && taxId) {
        setTaxIdTypeError(true);
      } else if (newAccountValues.taxIdType && !taxId) {
        setTaxIdTypeError(true);
      } else {
        setTaxIdError(false);
      }
    },
    [newAccountValues.taxIdType, setNewAccountValues],
  );

  const changeTaxIdType = useCallback(
    (taxIdType?: TaxIdType) => {
      setTaxIdTypeError(false); // Everytime we change either taxId or taxIdType we reset this error and check again
      setNewAccountValues((prevValues) => ({
        ...prevValues,
        taxIdType,
        taxId: taxIdType ? prevValues.taxId : '', // Clear taxId if taxIdType is None or null
      }));
      // If the taxIdType is invalid, we will show an error if the taxId is not empty
      if (!taxIdType) {
        setTaxIdError(false); // Clear taxId error
        setNewAccountValues((prevValues) => ({
          ...prevValues,
          taxId: '', // Clear taxId
        }));
      } else if (taxIdType && !newAccountValues.taxId) {
        setTaxIdTypeError(true);
      } else {
        setTaxIdTypeError(false);
        setTaxIdError(false); // Clear taxId error
      }
    },
    [newAccountValues.taxId, setNewAccountValues],
  );

  useEffect(() => {
    const isValid = !accNameError && !taxIdError && !taxIdTypeError;
    setIsFormValid(isValid);
  }, [accNameError, taxIdError, taxIdTypeError, setIsFormValid, newAccountValues]);

  return (
    <Grid container item XSmall={12} spacing={3}>
      <Grid item XSmall={12}>
        <Select
          id='accountType'
          fullWidth
          label={translate(
            translationKey('Label.AccountTypeField', TranslationNamespace.CloudServices),
          )}
          size='medium'
          defaultValue={newAccountValues.accountTaxType}
          value={newAccountValues.accountTaxType}
          onChange={(e) => changeAccountType(e.target.value as AccountTaxType)}
          variant='outlined'
          disabled={!isEditing}>
          {Object.values(AccountTaxType)
            .filter((accountTaxType) => accountTaxType !== AccountTaxType.Invalid)
            .map((accountTaxType) => (
              <MenuItem key={accountTaxType} value={accountTaxType}>
                {translate(
                  translationKey(
                    accountTaxTypeToTranslationKey[accountTaxType as AccountTaxType],
                    TranslationNamespace.CloudServices,
                  ),
                )}
              </MenuItem>
            ))}
        </Select>
      </Grid>
      <Grid item XSmall={12}>
        <TextField
          id='accountName'
          error={isEditing && accNameError}
          helperText={
            isEditing && accNameError
              ? translate(
                  translationKey(
                    'Description.AccountNameCharacterLimit',
                    TranslationNamespace.CloudServices,
                  ),
                )
              : ''
          }
          label={translate(
            translationKey('Label.FirstAndLastName', TranslationNamespace.CloudServices),
          )}
          fullWidth
          disabled={!isEditing}
          onChange={(e) => changeAccountName(e.target.value)}
          defaultValue={newAccountValues.accountName ?? ''}
          value={newAccountValues.accountName ?? ''}
        />
      </Grid>
      <Grid container item direction='row' alignItems='flex-start' spacing={3} XSmall={12}>
        <Grid item XSmall={6}>
          <Select
            id='taxIdType'
            fullWidth
            label={translate(
              translationKey('Label.SaveTaxIdType', TranslationNamespace.CloudServices),
            )}
            size='medium'
            helperText={
              isEditing && taxIdError
                ? translate(
                    translationKey(
                      'Description.TaxIdRequiredWithTaxIdType',
                      TranslationNamespace.CloudServices,
                    ),
                  )
                : ''
            }
            error={isEditing && taxIdTypeError}
            defaultValue={newAccountValues.taxIdType}
            value={newAccountValues.taxIdType}
            onChange={(e) => changeTaxIdType(e.target.value as TaxIdType)}
            variant='outlined'
            disabled={!isEditing}>
            <MenuItem value={undefined}>
              {translate(translationKey('Label.None', TranslationNamespace.CloudServices))}
            </MenuItem>
            {Object.values(TaxIdType)
              .filter((taxIdType) => taxIdType !== TaxIdType.Invalid)
              .map((taxIdType) => (
                <MenuItem key={taxIdType} value={taxIdType}>
                  {translate(
                    translationKey(
                      taxIdTypeToTranslationKey[taxIdType as TaxIdType],
                      TranslationNamespace.CloudServices,
                    ),
                  )}
                </MenuItem>
              ))}
          </Select>
        </Grid>
        <Grid item XSmall={6}>
          <TextField
            data-testid='taxId'
            id='taxId'
            error={isEditing && (taxIdError || taxIdTypeError)}
            helperText={
              // eslint-disable-next-line no-nested-ternary -- multiple conditions
              isEditing && taxIdError
                ? translate(
                    translationKey(
                      'Description.TaxIdCharacterLimit',
                      TranslationNamespace.CloudServices,
                    ),
                  )
                : isEditing && taxIdTypeError
                  ? translate(
                      translationKey(
                        'Description.TaxIdRequiredWithTaxIdType',
                        TranslationNamespace.CloudServices,
                      ),
                    )
                  : ''
            }
            label={translate(
              translationKey('Label.TaxIdOptional', TranslationNamespace.CloudServices),
            )}
            fullWidth
            disabled={!isEditing}
            onChange={(e) => changeTaxId(e.target.value)}
            defaultValue={newAccountValues.taxId}
            value={newAccountValues.taxId}
          />
        </Grid>
      </Grid>
    </Grid>
  );
};

export default withTranslation(AccountSettingsForm, [TranslationNamespace.CloudServices]);
