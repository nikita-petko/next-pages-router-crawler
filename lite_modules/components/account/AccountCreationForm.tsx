import { RobloxLocaleApiUserLocalizationLocusLocalesResponse } from '@rbx/client-locale/v1';
import { Button, Checkbox, Link, Radio, RadioGroup } from '@rbx/foundation-ui';
import { Autocomplete, FormLabel, TextField, Typography } from '@rbx/ui';
import router from 'next/router';
import { useId } from 'react';
import { Controller, FormProvider, useWatch } from 'react-hook-form';

import { EventName, logNativeClickEvent } from '@clients/unifiedLogger';
import useAccountFormStyles from '@components/account/AccountForm.styles';
import { FormFields } from '@constants/account';
import { OrganizationType } from '@constants/app';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import useAccountForm, { type AdAccountFormType } from '@hooks/account/useAccountForm';
import useCountries from '@hooks/useCountries';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import useTimezones from '@hooks/useTimezones';
import {
  AdAccountBusinessName,
  AdAccountIndividualName,
  CreateAdAccountRequest,
} from '@type/advertiser';
import { GetDefaultCountryValue } from '@utils/localization';

interface AdAccountCreationFormProps {
  handleSubmit: (values: CreateAdAccountRequest) => void;
  supportedLocales?: RobloxLocaleApiUserLocalizationLocusLocalesResponse;
}

const AdAccountCreationForm = ({ handleSubmit, supportedLocales }: AdAccountCreationFormProps) => {
  const { translate: translateAccount, translateHTML: translateAccountHTML } =
    useNamespacedTranslation(TranslationNamespace.Account);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const termsLabelId = useId();
  const termsCheckboxId = useId();
  const { countries } = useCountries();
  const { localizedDefaultTimeZone, localizedTimezones } = useTimezones();
  const {
    form,
    handleAccountTypeChange,
    handleBusinessNameChange,
    handleCountryChange,
    handleFirstNameChange,
    handleLastNameChange,
    handleNicknameChange,
    handleTaxIdChange,
    handleTimeZoneChange,
  } = useAccountForm({
    defaultValues: {
      [FormFields.BUSINESS_NAME]: '',
      [FormFields.COUNTRY]: GetDefaultCountryValue(supportedLocales),
      [FormFields.FIRST_NAME]: '',
      [FormFields.LAST_NAME]: '',
      [FormFields.NICKNAME]: '',
      [FormFields.TAX_ID]: '',
      [FormFields.TERMS_CHECKBOX]: false,
      [FormFields.TIME_ZONE]: localizedDefaultTimeZone,
      [FormFields.TYPE]: OrganizationType.ORGANIZATION_TYPE_INDIVIDUAL,
    },
  });

  const {
    classes: { nameWrapper, wrapper },
  } = useAccountFormStyles();

  const {
    control,
    formState: { errors, isSubmitting, isValid },
    handleSubmit: handleFormSubmit,
  } = form;
  const accountType = useWatch<AdAccountFormType, typeof FormFields.TYPE>({
    control,
    name: FormFields.TYPE,
  });

  const onSubmit = async () => {
    logNativeClickEvent(EventName.CreateAdAccountPageClickAccountCreationButton);
    await handleFormSubmit(async (data) => {
      const orgType = data[FormFields.TYPE];
      let businessNameObj: AdAccountBusinessName | undefined;
      let personalNameObj: AdAccountIndividualName | undefined;

      if (data[FormFields.TYPE] === OrganizationType.ORGANIZATION_TYPE_BUSINESS) {
        businessNameObj = {
          name: data[FormFields.BUSINESS_NAME]?.trim() || '',
        };
      }

      if (data[FormFields.TYPE] === OrganizationType.ORGANIZATION_TYPE_INDIVIDUAL) {
        personalNameObj = {
          first_name: data[FormFields.FIRST_NAME]?.trim() || '',
          last_name: data[FormFields.LAST_NAME]?.trim() || '',
        };
      }

      // for create call, only send the field if user enters the optional fields
      // including tax info, postal code and optional address line
      let taxInfoObj: string | undefined;
      if (data[FormFields.TAX_ID]?.trim() !== '') {
        taxInfoObj = data[FormFields.TAX_ID]?.trim();
      }

      const organization = {
        address: {
          country: data[FormFields.COUNTRY].value,
        },
        business_name: businessNameObj,
        individual_name: personalNameObj,
        tax_id: data[FormFields.TAX_ID]?.trim() || '',
        tax_info: taxInfoObj,
        time_zone: data[FormFields.TIME_ZONE].value,
        type: orgType,
      };

      const ad_account = {
        name: data[FormFields.NICKNAME]?.trim(),
      };

      const signed_terms_of_service = data[FormFields.TERMS_CHECKBOX];
      await handleSubmit({
        ad_account,
        organization,
        signed_terms_of_service,
      });
    })();
  };

  return (
    <div className={wrapper}>
      <FormProvider {...form}>
        <Typography variant='h5'>{translateAccount('Heading.AccountType')}</Typography>
        <Controller
          control={control}
          name={FormFields.TYPE}
          render={({ field }) => (
            <RadioGroup
              onBlur={field.onBlur}
              onValueChange={(v) => {
                const next = Number(v) as OrganizationType;
                field.onChange(next);
                handleAccountTypeChange(next);
              }}
              ref={field.ref}
              value={String(field.value)}>
              <div className='flex flex-row gap-large'>
                <Radio
                  key={OrganizationType.ORGANIZATION_TYPE_INDIVIDUAL}
                  label={translateAccount('Label.Personal')}
                  value={String(OrganizationType.ORGANIZATION_TYPE_INDIVIDUAL)}
                />
                <Radio
                  key={OrganizationType.ORGANIZATION_TYPE_BUSINESS}
                  label={translateAccount('Label.Business')}
                  value={String(OrganizationType.ORGANIZATION_TYPE_BUSINESS)}
                />
              </div>
            </RadioGroup>
          )}
        />

        {accountType === OrganizationType.ORGANIZATION_TYPE_INDIVIDUAL ? (
          <Typography
            display='grid'
            gap={2}
            gridTemplateColumns='repeat(auto-fit, minmax(300px, 1fr))'>
            <Controller
              control={control}
              name={FormFields.FIRST_NAME}
              render={({ field }) => (
                <TextField
                  className={nameWrapper}
                  {...field}
                  error={!!errors[FormFields.FIRST_NAME]}
                  helperText={errors[FormFields.FIRST_NAME]?.message}
                  id={FormFields.FIRST_NAME}
                  label={translateAccount('Label.FirstName')}
                  name={FormFields.FIRST_NAME}
                  onChange={(e) => {
                    handleFirstNameChange(e.target.value);
                  }}
                />
              )}
            />
            <Controller
              control={control}
              name={FormFields.LAST_NAME}
              render={({ field }) => (
                <TextField
                  className={nameWrapper}
                  {...field}
                  error={!!errors[FormFields.LAST_NAME]}
                  helperText={errors[FormFields.LAST_NAME]?.message}
                  id={FormFields.LAST_NAME}
                  label={translateAccount('Label.LastName')}
                  name={FormFields.LAST_NAME}
                  onChange={(e) => {
                    handleLastNameChange(e.target.value);
                  }}
                />
              )}
            />
          </Typography>
        ) : (
          <>
            <Controller
              control={control}
              name={FormFields.BUSINESS_NAME}
              render={({ field }) => (
                <TextField
                  {...field}
                  error={!!errors[FormFields.BUSINESS_NAME]}
                  helperText={
                    errors[FormFields.BUSINESS_NAME]?.message ||
                    translateAccount('Description.BusinessNameDisclosure')
                  }
                  id={FormFields.BUSINESS_NAME}
                  label={translateAccount('Label.BusinessName')}
                  name={FormFields.BUSINESS_NAME}
                  onChange={(e) => {
                    handleBusinessNameChange(e.target.value);
                  }}
                />
              )}
            />
            <Controller
              control={control}
              name={FormFields.TAX_ID}
              render={({ field }) => (
                <TextField
                  {...field}
                  error={!!errors[FormFields.TAX_ID]}
                  helperText={errors[FormFields.TAX_ID]?.message}
                  id={FormFields.TAX_ID}
                  label={translateAccount('Label.TaxIdOptional')}
                  name={FormFields.TAX_ID}
                  onChange={(e) => {
                    handleTaxIdChange(e.target.value);
                  }}
                />
              )}
            />
          </>
        )}
        <Controller
          control={control}
          name={FormFields.COUNTRY}
          render={({ field }) => (
            <Autocomplete
              disableClearable
              getOptionLabel={(option) => option.title || ''}
              id={FormFields.COUNTRY}
              onChange={(_event, countryObj) => handleCountryChange(countryObj)}
              options={countries}
              renderInput={(params) => (
                <TextField
                  {...params}
                  error={Boolean(errors[FormFields.COUNTRY])}
                  helperText={errors[FormFields.COUNTRY]?.message}
                  label={translateAccount('Label.Location')}
                  name={FormFields.COUNTRY}
                  onBlur={field.onBlur}
                />
              )}
              value={field.value}
            />
          )}
        />

        <Typography variant='h5'>{translateAccount('Heading.AccountInfo')}</Typography>

        <Controller
          control={control}
          name={FormFields.NICKNAME}
          render={({ field }) => (
            <TextField
              {...field}
              error={!!errors[FormFields.NICKNAME]}
              helperText={errors[FormFields.NICKNAME]?.message}
              id={FormFields.NICKNAME}
              label={translateAccount('Label.AdAccountNickname')}
              name={FormFields.NICKNAME}
              onChange={(e) => {
                handleNicknameChange(e.target.value);
              }}
            />
          )}
        />
        <Controller
          control={control}
          name={FormFields.TIME_ZONE}
          render={({ field }) => (
            <Autocomplete
              disableClearable
              getOptionLabel={(option) => (option && option.title) || ''}
              id={FormFields.TIME_ZONE}
              onChange={(_event, timezoneObj) => handleTimeZoneChange(timezoneObj)}
              options={localizedTimezones}
              renderInput={(params) => (
                <TextField
                  {...params}
                  error={Boolean(errors[FormFields.TIME_ZONE])}
                  helperText={
                    errors[FormFields.TIME_ZONE]?.message ||
                    translateAccount('Description.TimezoneCannotUpdate')
                  }
                  label={translateAccount('Label.Timezone')}
                  name={FormFields.TIME_ZONE}
                  onBlur={field.onBlur}
                />
              )}
              value={field.value}
            />
          )}
        />
        <Controller
          control={control}
          name={FormFields.TERMS_CHECKBOX}
          render={({ field }) => (
            <>
              <div className='flex items-start gap-small'>
                <Checkbox
                  aria-labelledby={termsLabelId}
                  id={termsCheckboxId}
                  isChecked={field.value === true}
                  name={FormFields.TERMS_CHECKBOX}
                  onCheckedChange={(checked) => {
                    field.onChange(checked === true);
                  }}
                  placement='Start'
                  size='Small'
                />
                <Typography
                  className='cursor-pointer'
                  component='label'
                  htmlFor={termsCheckboxId}
                  id={termsLabelId}
                  variant='body1'>
                  {translateAccountHTML('Description.TermsAgreement', [
                    {
                      closing: 'linkEnd',
                      content: (chunks) => (
                        <Link
                          href='https://en.help.roblox.com/hc/articles/15494846263060'
                          isExternal={false}
                          rel='noopener noreferrer'
                          target='_blank'
                          underline='always'>
                          {chunks}
                        </Link>
                      ),
                      opening: 'linkStart',
                    },
                  ])}
                </Typography>
              </div>
              {errors[FormFields.TERMS_CHECKBOX] && (
                <FormLabel error>{errors[FormFields.TERMS_CHECKBOX]?.message}</FormLabel>
              )}
            </>
          )}
        />

        <Typography display='flex' gap={2} variant='body1'>
          <Button
            isDisabled={!isValid || isSubmitting}
            isLoading={isSubmitting}
            onClick={onSubmit}
            size='Medium'
            variant='Emphasis'>
            {translateAccount('Action.CreateAdAccount')}
          </Button>
          <Button onClick={() => router.push(Routes.LANDING)} size='Medium' variant='Standard'>
            {translateMisc('Action.Cancel')}
          </Button>
        </Typography>
      </FormProvider>
    </div>
  );
};

export default AdAccountCreationForm;
