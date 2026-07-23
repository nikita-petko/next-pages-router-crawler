import { Button } from '@rbx/foundation-ui';
import { Autocomplete, TextField } from '@rbx/ui';
import { useRouter } from 'next/router';
import { Controller, FormProvider, useWatch } from 'react-hook-form';

import useAccountFormStyles from '@components/account/AccountForm.styles';
import { FormFields } from '@constants/account';
import { OrganizationType } from '@constants/app';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import useAccountForm, { type AdAccountFormType } from '@hooks/account/useAccountForm';
import useCountries from '@hooks/useCountries';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import useTimezones from '@hooks/useTimezones';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import {
  AdAccountInfo,
  AdAccountOrganizationInfoResponse,
  UpdateAdvertiserRequest,
} from '@type/advertiser';

interface AccountUpdateFormProps {
  adAccountInfo: AdAccountInfo;
  handleSubmit: (data: UpdateAdvertiserRequest) => Promise<void>;
  organizationInfo: AdAccountOrganizationInfoResponse;
}

const AccountUpdateForm = ({
  adAccountInfo,
  handleSubmit,
  organizationInfo,
}: AccountUpdateFormProps) => {
  const { translate: translateAccount } = useNamespacedTranslation(TranslationNamespace.Account);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const { countries, getCountryByCode } = useCountries();
  const { getTimezoneByEnum } = useTimezones();
  const isAdAccountAutoCreateEnabled = useAppStore(
    (state: AppStoreType) => state.appMetadataState?.data?.isAdAccountAutoCreateEnabled ?? false,
  );
  const {
    form,
    handleBusinessNameChange,
    handleCountryChange,
    handleFirstNameChange,
    handleLastNameChange,
    handleNicknameChange,
    handleTaxIdChange,
  } = useAccountForm({
    defaultValues: {
      [FormFields.BUSINESS_NAME]: organizationInfo.business_name?.name,
      [FormFields.COUNTRY]: getCountryByCode(organizationInfo.address.country),
      [FormFields.FIRST_NAME]: organizationInfo.individual_name?.first_name,
      [FormFields.LAST_NAME]: organizationInfo.individual_name?.last_name,
      [FormFields.NICKNAME]: adAccountInfo?.name,
      [FormFields.TAX_ID]: organizationInfo.tax_info?.value,
      [FormFields.TERMS_CHECKBOX]: true,
      [FormFields.TIME_ZONE]: getTimezoneByEnum(organizationInfo.time_zone),
      [FormFields.TYPE]: organizationInfo.type as OrganizationType,
    },
  });

  const {
    classes: { nameWrapper, wrapper },
  } = useAccountFormStyles();

  const router = useRouter();

  const {
    control,
    formState: { isSubmitting, isValid },
    handleSubmit: handleFormSubmit,
  } = form;
  const accountType = useWatch<AdAccountFormType, typeof FormFields.TYPE>({
    control,
    name: FormFields.TYPE,
  });

  const onSubmit = async () => {
    await handleFormSubmit(async (data) => {
      let businessNameObj;
      let personalNameObj;
      let taxInfoObj: string | undefined;

      if (!isAdAccountAutoCreateEnabled) {
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
      }

      if (organizationInfo.tax_info?.value !== data[FormFields.TAX_ID]?.trim()) {
        taxInfoObj = data[FormFields.TAX_ID]?.trim() || '';
      }

      const adAccountDataToSubmit: UpdateAdvertiserRequest = {
        ad_account: {
          id: adAccountInfo.id!,
          name: isAdAccountAutoCreateEnabled
            ? adAccountInfo.name
            : data[FormFields.NICKNAME]?.trim() || '',
        },
        organization: {
          address: {
            country: data[FormFields.COUNTRY].value,
          },
          business_name: businessNameObj,
          id: organizationInfo!.id,
          individual_name: personalNameObj,
          tax_info: taxInfoObj,
        },
      };

      await handleSubmit(adAccountDataToSubmit);
    })();
  };

  return (
    <div className={wrapper}>
      <FormProvider {...form}>
        {accountType === OrganizationType.ORGANIZATION_TYPE_INDIVIDUAL ? (
          <>
            <span className='text-heading-medium'>
              {translateAccount('Heading.PersonalAccount')}
            </span>
            {!isAdAccountAutoCreateEnabled && (
              <span className='flex flex-row gap-large'>
                <Controller
                  control={control}
                  name={FormFields.FIRST_NAME}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      className={nameWrapper}
                      error={!!error}
                      helperText={error?.message}
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
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      className={nameWrapper}
                      error={!!error}
                      helperText={error?.message}
                      id={FormFields.LAST_NAME}
                      label={translateAccount('Label.LastName')}
                      name={FormFields.LAST_NAME}
                      onChange={(e) => {
                        handleLastNameChange(e.target.value);
                      }}
                    />
                  )}
                />
              </span>
            )}
          </>
        ) : (
          <>
            <span className='text-heading-medium'>
              {translateAccount('Heading.BusinessAccount')}
            </span>
            <Controller
              control={control}
              name={FormFields.BUSINESS_NAME}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  error={!!error}
                  helperText={
                    error?.message || translateAccount('Description.BusinessNameDisclosure')
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
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  error={!!error}
                  helperText={error?.message}
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
          render={({ field, fieldState: { error } }) => (
            <Autocomplete
              disableClearable
              getOptionLabel={(option) => option.title || ''}
              id={FormFields.COUNTRY}
              isOptionEqualToValue={(option, value) => option.value === value.value}
              onChange={(_event, countryObj) => handleCountryChange(countryObj)}
              options={countries}
              renderInput={(params) => (
                <TextField
                  {...params}
                  error={Boolean(error)}
                  helperText={error?.message}
                  label={translateAccount('Label.Location')}
                  name={FormFields.COUNTRY}
                  onBlur={field.onBlur}
                />
              )}
              value={field.value}
            />
          )}
        />

        <span className='text-heading-medium'>{translateAccount('Heading.AccountInfo')}</span>

        {!isAdAccountAutoCreateEnabled && (
          <Controller
            control={control}
            name={FormFields.NICKNAME}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                error={!!error}
                helperText={error?.message}
                id={FormFields.NICKNAME}
                label={translateAccount('Label.AdAccountNickname')}
                name={FormFields.NICKNAME}
                onChange={(e) => {
                  handleNicknameChange(e.target.value);
                }}
              />
            )}
          />
        )}
        <TextField
          disabled
          id={FormFields.ACCOUNT_ID}
          label={translateAccount('Label.AdAccountId')}
          value={adAccountInfo?.id}
        />
        <TextField
          disabled
          id={FormFields.TIME_ZONE}
          label={translateAccount('Label.Timezone')}
          value={getTimezoneByEnum(organizationInfo.time_zone)?.title}
        />

        <span className='flex gap-large'>
          <Button
            isDisabled={!isValid || isSubmitting}
            isLoading={isSubmitting}
            onClick={onSubmit}
            size='Medium'
            variant='Emphasis'>
            {translateMisc('Action.Save')}
          </Button>
          <Button
            onClick={() => {
              router.push({
                pathname: Routes.ACCOUNT_OVERVIEW,
              });
            }}
            size='Medium'
            variant='Standard'>
            {translateMisc('Action.Cancel')}
          </Button>
        </span>
      </FormProvider>
    </div>
  );
};

export default AccountUpdateForm;
