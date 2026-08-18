import { RobloxLocaleApiUserLocalizationLocusLocalesResponse } from '@rbx/client-locale/v1';
import { Button, Checkbox, Link, Radio, RadioGroup, TextInput } from '@rbx/foundation-ui';
import { FormLabel } from '@rbx/ui';
import router from 'next/router';
import { useId } from 'react';
import { Controller, FormProvider, useWatch } from 'react-hook-form';

import { EventName, logNativeClickEvent } from '@clients/unifiedLogger';
import useAccountFormStyles from '@components/account/AccountForm.styles';
import TitleValueAutocomplete from '@components/common/form/TitleValueAutocomplete';
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
    classes: { nameGrid, nameWrapper, wrapper },
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
        <span className='text-heading-small'>{translateAccount('Heading.AccountType')}</span>
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
          <span className={nameGrid}>
            <Controller
              control={control}
              name={FormFields.FIRST_NAME}
              render={({ field }) => (
                <TextInput
                  className={nameWrapper}
                  {...field}
                  error={errors[FormFields.FIRST_NAME]?.message}
                  hasError={Boolean(errors[FormFields.FIRST_NAME])}
                  id={FormFields.FIRST_NAME}
                  label={translateAccount('Label.FirstName')}
                  name={FormFields.FIRST_NAME}
                  onChange={(e) => {
                    handleFirstNameChange(e.target.value);
                  }}
                  size='Medium'
                  value={field.value ?? ''}
                />
              )}
            />
            <Controller
              control={control}
              name={FormFields.LAST_NAME}
              render={({ field }) => (
                <TextInput
                  className={nameWrapper}
                  {...field}
                  error={errors[FormFields.LAST_NAME]?.message}
                  hasError={Boolean(errors[FormFields.LAST_NAME])}
                  id={FormFields.LAST_NAME}
                  label={translateAccount('Label.LastName')}
                  name={FormFields.LAST_NAME}
                  onChange={(e) => {
                    handleLastNameChange(e.target.value);
                  }}
                  size='Medium'
                  value={field.value ?? ''}
                />
              )}
            />
          </span>
        ) : (
          <>
            <Controller
              control={control}
              name={FormFields.BUSINESS_NAME}
              render={({ field }) => (
                <TextInput
                  {...field}
                  error={errors[FormFields.BUSINESS_NAME]?.message}
                  hasError={Boolean(errors[FormFields.BUSINESS_NAME])}
                  helperText={translateAccount('Description.BusinessNameDisclosure')}
                  id={FormFields.BUSINESS_NAME}
                  label={translateAccount('Label.BusinessName')}
                  name={FormFields.BUSINESS_NAME}
                  onChange={(e) => {
                    handleBusinessNameChange(e.target.value);
                  }}
                  size='Medium'
                  value={field.value ?? ''}
                />
              )}
            />
            <Controller
              control={control}
              name={FormFields.TAX_ID}
              render={({ field }) => (
                <TextInput
                  {...field}
                  error={errors[FormFields.TAX_ID]?.message}
                  hasError={Boolean(errors[FormFields.TAX_ID])}
                  id={FormFields.TAX_ID}
                  label={translateAccount('Label.TaxIdOptional')}
                  name={FormFields.TAX_ID}
                  onChange={(e) => {
                    handleTaxIdChange(e.target.value);
                  }}
                  size='Medium'
                  value={field.value ?? ''}
                />
              )}
            />
          </>
        )}
        <Controller
          control={control}
          name={FormFields.COUNTRY}
          render={({ field }) => (
            <TitleValueAutocomplete
              dataTestId={FormFields.COUNTRY}
              errorMessage={errors[FormFields.COUNTRY]?.message}
              label={translateAccount('Label.Location')}
              onBlur={field.onBlur}
              onChange={handleCountryChange}
              options={countries}
              value={field.value}
            />
          )}
        />

        <span className='text-heading-small'>{translateAccount('Heading.AccountInfo')}</span>

        <Controller
          control={control}
          name={FormFields.NICKNAME}
          render={({ field }) => (
            <TextInput
              {...field}
              error={errors[FormFields.NICKNAME]?.message}
              hasError={Boolean(errors[FormFields.NICKNAME])}
              id={FormFields.NICKNAME}
              label={translateAccount('Label.AdAccountNickname')}
              name={FormFields.NICKNAME}
              onChange={(e) => {
                handleNicknameChange(e.target.value);
              }}
              size='Medium'
              value={field.value ?? ''}
            />
          )}
        />
        <Controller
          control={control}
          name={FormFields.TIME_ZONE}
          render={({ field }) => (
            <TitleValueAutocomplete
              dataTestId={FormFields.TIME_ZONE}
              errorMessage={errors[FormFields.TIME_ZONE]?.message}
              helperText={translateAccount('Description.TimezoneCannotUpdate')}
              label={translateAccount('Label.Timezone')}
              onBlur={field.onBlur}
              onChange={handleTimeZoneChange}
              options={localizedTimezones}
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
                <label
                  className='text-body-large cursor-pointer'
                  htmlFor={termsCheckboxId}
                  id={termsLabelId}>
                  {translateAccountHTML('Description.TermsAgreement', [
                    {
                      closing: 'linkEnd',
                      content: (chunks) => (
                        <Link
                          href='https://en.help.roblox.com/hc/articles/15494846263060'
                          rel='noopener noreferrer'
                          target='_blank'
                          underline='always'>
                          {chunks}
                        </Link>
                      ),
                      opening: 'linkStart',
                    },
                  ])}
                </label>
              </div>
              {errors[FormFields.TERMS_CHECKBOX] && (
                <FormLabel error>{errors[FormFields.TERMS_CHECKBOX]?.message}</FormLabel>
              )}
            </>
          )}
        />

        <span className='flex gap-large'>
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
        </span>
      </FormProvider>
    </div>
  );
};

export default AdAccountCreationForm;
