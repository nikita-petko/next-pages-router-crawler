import { RobloxLocaleApiUserLocalizationLocusLocalesResponse } from '@rbx/client-locale/v1';
import { Button } from '@rbx/foundation-ui';
import { AxiosError } from 'axios';
import { useRouter } from 'next/router';
import { ReactNode, useEffect, useState } from 'react';

import AdAccountCreationForm from '@components/account/AccountCreationForm';
import AdsManagerPageBaseLayout from '@components/common/AdsManagerDefaultLayout';
import { getCreatorHubPageLayout } from '@components/common/CreatorHubPageLayout';
import ErrorCodes from '@constants/errorCodes';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import { useGetSupportedLocales } from '@hooks/useGetSupportedLocales';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { createAdAccount } from '@services/ads/adAccountService';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { useModalStore } from '@stores/modalStoreProvider';
import { CreateAdAccountRequest } from '@type/advertiser';
import { CaptureException } from '@utils/error';
import { GetLocalStorage, StorageKeys } from '@utils/localStorage';

const getAccountCustomerInfoPageLayout = (page: ReactNode) =>
  getCreatorHubPageLayout(page, {
    headerKey: 'Heading.CreateAdAccount',
    headerNamespace: TranslationNamespace.Account,
    rail: undefined,
  });

const AdAccountCreationWizard = () => {
  const { translate: translateAccount } = useNamespacedTranslation(TranslationNamespace.Account);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const { setModalConfigData, setModalOpen } = useModalStore();
  const { adAccountId = GetLocalStorage(StorageKeys.AD_ACCOUNT_ID), setAdAccountId } = useAppStore(
    (state: AppStoreType) => ({
      adAccountId: state.appData.adAccountId,
      setAdAccountId: state.setAdAccountId,
    }),
  );
  const router = useRouter();
  const getSupportedLocales = useGetSupportedLocales();

  const [supportedLocalesRequestLoading, setSupportedLocalesRequestLoading] =
    useState<boolean>(true);

  const [supportedLocales, setSupportedLocales] = useState<
    RobloxLocaleApiUserLocalizationLocusLocalesResponse | undefined
  >(undefined);

  // Redirect to manage page if user already has an ad account
  useEffect(() => {
    const hasAdAccount = Boolean(adAccountId);
    const isAlreadyAtDestination = router.asPath === Routes.MANAGE;

    if (hasAdAccount && !isAlreadyAtDestination) {
      router.push(Routes.MANAGE);
    }
  }, [adAccountId, router]);

  useEffect(() => {
    getSupportedLocales().then((locales) => {
      setSupportedLocales(locales);
      setSupportedLocalesRequestLoading(false);
    });
  }, [getSupportedLocales]);

  const handleSubmit = async (values: CreateAdAccountRequest) => {
    try {
      const createAdAccountResponse = await createAdAccount(values);
      const { ad_account } = createAdAccountResponse;
      const isAlreadyAtDestination = router.asPath === Routes.MANAGE;

      // Update account ID immediately before redirect
      if (ad_account?.id) {
        setAdAccountId(ad_account.id);
      }

      if (!isAlreadyAtDestination) {
        router.push({
          pathname: Routes.MANAGE,
          query: {
            fromSuccessfulAdAccountCreation: true,
          },
        });
      }
    } catch (error) {
      const isAxiosError = error instanceof AxiosError;
      CaptureException(isAxiosError ? error.response : (error as Error));
      const dialogContent =
        isAxiosError &&
        error.response?.data?.error?.code === ErrorCodes.VALIDATE_DISPLAY_NAME_FAILED
          ? translateAccount('Message.BusinessNameNotValid')
          : translateMisc('Message.GenericError');

      setModalConfigData({
        dialogActions: (
          <Button
            onClick={() => {
              setModalOpen(false);
            }}
            size='Medium'
            variant='Standard'>
            {translateMisc('Action.Close')}
          </Button>
        ),
        dialogContent,
        handleClose: () => {
          setModalOpen(false);
        },
        title: translateMisc('Label.Error'),
      });
      setModalOpen(true);
    }
  };

  // Don't render the form if still loading or user already has account
  if (supportedLocalesRequestLoading || Boolean(adAccountId)) {
    return null;
  }

  return (
    <AdsManagerPageBaseLayout isLoading={false}>
      <AdAccountCreationForm handleSubmit={handleSubmit} supportedLocales={supportedLocales} />
    </AdsManagerPageBaseLayout>
  );
};

AdAccountCreationWizard.getPageLayout = getAccountCustomerInfoPageLayout;

export default AdAccountCreationWizard;
