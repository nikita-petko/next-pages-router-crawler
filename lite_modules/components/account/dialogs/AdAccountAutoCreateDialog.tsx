import { Button, Link, ProgressCircle } from '@rbx/foundation-ui';
import { AxiosError } from 'axios';
import { type ReactElement, useEffect, useState } from 'react';
import { Controller, FormProvider } from 'react-hook-form';

import { EventName, logNativeImpressionEvent } from '@clients/unifiedLogger';
import useAccountFormStyles from '@components/account/AccountForm.styles';
import { openDialog } from '@components/common/dialog/actions';
import BaseDialog from '@components/common/dialog/BaseDialog';
import { openErrorDialogWithMessage } from '@components/common/dialog/errorDialog';
import type { BaseInjectedDialogProps } from '@components/common/dialog/types';
import TitleValueAutocomplete from '@components/common/form/TitleValueAutocomplete';
import { FormFields } from '@constants/account';
import { OrganizationType } from '@constants/app';
import ErrorCodes from '@constants/errorCodes';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import useAccountForm from '@hooks/account/useAccountForm';
import useCountries from '@hooks/useCountries';
import { useGetSupportedLocales } from '@hooks/useGetSupportedLocales';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import useTimezones from '@hooks/useTimezones';
import { createAdAccount } from '@services/ads/adAccountService';
import { getCreatorContactInfo } from '@services/brandPlatform/creatorInfoService';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { CaptureException } from '@utils/error';
import { GetDefaultCountryValue } from '@utils/localization';
import { SetLocalStorage, StorageKeys } from '@utils/localStorage';
import { ROBLOX_ACCOUNT_COUNTRIES } from '@utils/location';

interface AdAccountAutoCreateDialogProps extends BaseInjectedDialogProps {
  entryPoint?: string;
  groupId?: number;
  onSuccess: () => void;
}

const AdAccountAutoCreateDialog = ({
  entryPoint = 'unknown',
  groupId,
  onClose,
  onSuccess,
  setDismissible,
}: AdAccountAutoCreateDialogProps): ReactElement => {
  const { translate: translateAccount, translateHTML: translateAccountHTML } =
    useNamespacedTranslation(TranslationNamespace.Account);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);

  const currentUser = useAppStore((state: AppStoreType) => state.appData.currentUser);
  const setAdAccountId = useAppStore((state: AppStoreType) => state.setAdAccountId);
  const fetchEssentialAppInfo = useAppStore((state: AppStoreType) => state.fetchEssentialAppInfo);

  const [isPending, setIsPending] = useState<boolean>(false);
  const [loadingLocales, setLoadingLocales] = useState<boolean>(true);
  const [supportedLocales, setSupportedLocales] = useState<
    Awaited<ReturnType<ReturnType<typeof useGetSupportedLocales>>> | undefined
  >(undefined);
  const [creatorInfoLoaded, setCreatorInfoLoaded] = useState<boolean>(false);

  const getSupportedLocales = useGetSupportedLocales();
  const { getCountryByCode } = useCountries();
  const { localizedDefaultTimeZone, localizedTimezones } = useTimezones();
  const {
    classes: { setupFormColumn },
  } = useAccountFormStyles();
  const accountSetupDescriptionKey =
    groupId !== undefined
      ? 'Description.GroupAccountTimezoneSetup'
      : 'Description.PersonalAccountTimezoneSetup';
  const accountSetupTitleKey =
    groupId !== undefined ? 'Heading.GroupAccountSetup' : 'Heading.AdditionalInformation';

  useEffect(() => {
    getSupportedLocales().then((locales) => {
      setSupportedLocales(locales);
      setLoadingLocales(false);
    });
  }, [getSupportedLocales]);

  const { form, handleCountryChange, handleTimeZoneChange } = useAccountForm({
    defaultValues: {
      [FormFields.BUSINESS_NAME]: '',
      [FormFields.COUNTRY]: GetDefaultCountryValue(supportedLocales),
      [FormFields.FIRST_NAME]: '',
      [FormFields.LAST_NAME]: '',
      [FormFields.NICKNAME]: currentUser?.name || '',
      [FormFields.TAX_ID]: '',
      [FormFields.TERMS_CHECKBOX]: true,
      [FormFields.TIME_ZONE]: localizedDefaultTimeZone,
      [FormFields.TYPE]: OrganizationType.ORGANIZATION_TYPE_INDIVIDUAL,
    },
    isAdAccountAutoCreateEnabled: true,
  });

  const {
    control,
    formState: { errors, isValid: formIsValid },
    handleSubmit: handleFormSubmit,
  } = form;

  useEffect(() => {
    if (creatorInfoLoaded || !currentUser?.id) {
      return;
    }

    const prefillFromCreatorHub = async (): Promise<void> => {
      const contactInfoResult = await getCreatorContactInfo(currentUser.id).catch(() => undefined);
      const country = contactInfoResult?.creatorContact?.address?.country;
      if (country) {
        const match = ROBLOX_ACCOUNT_COUNTRIES.find(
          (c) => c.title.toLowerCase() === country.toLowerCase(),
        );
        if (match) {
          handleCountryChange(getCountryByCode(match.value));
        }
      }
      setCreatorInfoLoaded(true);
    };

    prefillFromCreatorHub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creatorInfoLoaded, currentUser?.id]);

  const handleSave = async (): Promise<void> => {
    if (isPending) {
      return;
    }

    setIsPending(true);
    setDismissible(false);
    try {
      await handleFormSubmit(async (data) => {
        try {
          const response = await createAdAccount(
            {
              ad_account: { name: data[FormFields.NICKNAME]?.trim() },
              organization: {
                address: { country: data[FormFields.COUNTRY].value },
                individual_name: { first_name: '', last_name: '' },
                tax_id: '',
                time_zone: data[FormFields.TIME_ZONE].value,
                type: OrganizationType.ORGANIZATION_TYPE_INDIVIDUAL,
              },
              signed_terms_of_service: true,
            },
            groupId !== undefined ? { groupId } : undefined,
          );

          const adAccountId = (response as { ad_account?: { id?: string } })?.ad_account?.id;
          if (groupId !== undefined) {
            await fetchEssentialAppInfo({ forceRefresh: true, groupId });
          } else if (adAccountId) {
            logNativeImpressionEvent(EventName.UserAdAccountAutoCreateSuccess, {
              accountScope: 'user',
              adAccountId,
              entryPoint,
            });
            setAdAccountId(adAccountId);
            SetLocalStorage(StorageKeys.AD_ACCOUNT_ID, adAccountId, 604800);
            await fetchEssentialAppInfo({ forceRefresh: true, urlPath: Routes.MANAGE });
          }

          onClose();
          onSuccess();
        } catch (error) {
          const isAxiosError = error instanceof AxiosError;
          if (groupId === undefined) {
            logNativeImpressionEvent(EventName.UserAdAccountAutoCreateFailed, {
              accountScope: 'user',
              entryPoint,
              errorCode: isAxiosError ? error.response?.data?.error?.code : undefined,
              errorStatus: isAxiosError ? String(error.response?.status ?? '') : undefined,
            });
          }
          CaptureException(isAxiosError ? error.response : (error as Error));
          const message =
            isAxiosError &&
            error.response?.data?.error?.code === ErrorCodes.VALIDATE_DISPLAY_NAME_FAILED
              ? translateAccount('Message.BusinessNameNotValid')
              : translateMisc('Message.GenericError');

          openErrorDialogWithMessage(message);
        }
      })();
    } finally {
      setIsPending(false);
      setDismissible(true);
    }
  };

  if (loadingLocales) {
    return (
      <BaseDialog
        dialogBody={
          <div className='flex items-center justify-center padding-medium'>
            <ProgressCircle
              ariaLabel={translateMisc('Label.Loading')}
              size='Medium'
              variant='Indeterminate'
            />
          </div>
        }
        dialogFooter={
          <Button isDisabled onClick={onClose} size='Medium' variant='Standard'>
            {translateMisc('Action.Cancel')}
          </Button>
        }
        dialogTitle={translateAccount(accountSetupTitleKey)}
      />
    );
  }

  return (
    <BaseDialog
      dialogBody={
        <FormProvider {...form}>
          <div className={setupFormColumn}>
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

            <div className='text-body-large'>
              {translateAccountHTML('Description.TermsAgreementV2', [
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
            </div>
          </div>
        </FormProvider>
      }
      dialogDescription={
        <div className='padding-bottom-medium'>{translateAccount(accountSetupDescriptionKey)}</div>
      }
      dialogFooter={
        <>
          <Button
            isDisabled={!formIsValid || isPending}
            isLoading={isPending}
            onClick={handleSave}
            size='Medium'
            variant='Emphasis'>
            {translateMisc('Action.Save')}
          </Button>
          <Button isDisabled={isPending} onClick={onClose} size='Medium' variant='Standard'>
            {translateMisc('Action.Cancel')}
          </Button>
        </>
      }
      dialogTitle={translateAccount(accountSetupTitleKey)}
    />
  );
};

export const openAdAccountAutoCreateDialog = (props: {
  entryPoint?: string;
  groupId?: number;
  onSuccess: () => void;
}): void => {
  openDialog({ component: AdAccountAutoCreateDialog, props });
};

export default AdAccountAutoCreateDialog;
