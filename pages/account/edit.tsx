import { Button } from '@rbx/foundation-ui';
import { AxiosError } from 'axios';
import { useRouter } from 'next/router';
import { ReactNode, useEffect, useState } from 'react';

import AccountUpdateForm from '@components/account/AccountUpdateForm';
import AdsManagerPageBaseLayout from '@components/common/AdsManagerDefaultLayout';
import { getCreatorHubPageLayout } from '@components/common/CreatorHubPageLayout';
import { openErrorDialog } from '@components/common/dialog/errorDialog';
import ErrorCodes from '@constants/errorCodes';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { updateAdvertiserAccount } from '@services/ads/adAccountService';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { useModalStore } from '@stores/modalStoreProvider';
import {
  AdAccountInfo,
  AdAccountOrganizationInfoResponse,
  AdAccountShape,
  UpdateAdvertiserRequest,
} from '@type/advertiser';
import { AMAErrorResponseType } from '@type/errorResponse';
import { CaptureException, IsImpersonationError } from '@utils/error';
import { SetErrorModalImpersonationConfig } from '@utils/errorModalImpersonation';

const getAccountCustomerInfoPageLayout = (page: ReactNode) =>
  getCreatorHubPageLayout(page, {
    headerKey: 'Heading.AccountOverview',
    headerNamespace: TranslationNamespace.Account,
  });

const AdAccountCreationWizard = () => {
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const { translate: translateAccount } = useNamespacedTranslation(TranslationNamespace.Account);
  const [pageFetchingEssentialData, setPageFetchingEssentialData] = useState<boolean>(true);
  const { adAccountInfo, organizationInfo } = useAppStore((state: AppStoreType) => state.appData);
  const setOrganizationInfo = useAppStore((state: AppStoreType) => state.setOrganizationInfo);
  const setAdAccountInfo = useAppStore((state: AppStoreType) => state.setAdAccountInfo);

  // `setModalConfigData` / `setModalOpen` remain for the inline
  // business-name-validation modal + impersonation modal (handled by
  // Group 3 once those domain dialogs land). Generic errors go through
  // `openErrorDialog`.
  const { setModalConfigData, setModalOpen } = useModalStore();
  const router = useRouter();

  const handleSubmit = async (adAccountDataToSubmit: UpdateAdvertiserRequest) => {
    await updateAdvertiserAccount(adAccountDataToSubmit)
      .then(() => {
        router.push({
          pathname: Routes.ACCOUNT_OVERVIEW,
          query: {
            isFromSuccessfulAccountEdit: true,
          },
        });
        // on update we send null for optional fields if the field is not
        // being updated (e.g. tax_info)
        // we need to check if field is being updated or not and use the
        // correct value for displaying content after refresh
        let taxInfoValue = organizationInfo?.tax_info?.value;
        if (adAccountDataToSubmit?.organization?.tax_info !== null) {
          // only use updated data when user edited tax id field
          taxInfoValue = adAccountDataToSubmit?.organization?.tax_info;
        }
        let postalCodeValue = organizationInfo?.address?.optional_postal_code?.value;
        if (adAccountDataToSubmit?.organization?.address?.optional_postal_code !== null) {
          postalCodeValue = adAccountDataToSubmit?.organization?.address?.optional_postal_code;
        }
        let lineAddress2Value = organizationInfo?.address?.optional_line_address?.value;
        if (adAccountDataToSubmit?.organization?.address?.optional_line_address !== null) {
          lineAddress2Value = adAccountDataToSubmit?.organization?.address?.optional_line_address;
        }
        // When router.push happens - the data saved in the page does not refresh.
        // To reflect the changes we made in the update call we have to update the page context
        const newOrganizationInfo = {
          ...organizationInfo,
          ...adAccountDataToSubmit.organization,
          address: {
            ...organizationInfo.address,
            city: adAccountDataToSubmit?.organization?.address?.city || '',
            country: adAccountDataToSubmit?.organization?.address?.country,
            line_address: adAccountDataToSubmit?.organization?.address?.line_address || '',
            line_address_2: adAccountDataToSubmit?.organization?.address?.line_address_2 || '',
            optional_line_address: { value: lineAddress2Value || '' },
            optional_postal_code: { value: postalCodeValue || '' },
            postal_code: adAccountDataToSubmit?.organization?.address?.postal_code || '',
            state: adAccountDataToSubmit?.organization?.address?.state || '',
          },
          business_name: { name: adAccountDataToSubmit?.organization?.business_name?.name || '' },
          tax_id: adAccountDataToSubmit?.organization?.tax_info,
          tax_info: {
            value: taxInfoValue || '',
          },
        };
        const newAdAccountInfo = {
          ...adAccountInfo,
          ...adAccountDataToSubmit.ad_account,
        } as AdAccountShape;

        setAdAccountInfo(newAdAccountInfo);
        setOrganizationInfo(newOrganizationInfo);
      })
      .catch((error: AxiosError<AMAErrorResponseType>) => {
        CaptureException(error);
        if (error?.response?.data?.error?.code === ErrorCodes.VALIDATE_DISPLAY_NAME_FAILED) {
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
            dialogContent: translateAccount('Message.BusinessNameNotValid'),
            handleClose: () => {
              setModalOpen(false);
            },
            title: translateMisc('Label.Error'),
          });
          setModalOpen(true);
        } else if (IsImpersonationError(error)) {
          SetErrorModalImpersonationConfig(setModalOpen, setModalConfigData);
        } else {
          openErrorDialog(error?.response?.data);
        }
      });
  };

  useEffect(() => {
    if (organizationInfo && adAccountInfo) {
      setPageFetchingEssentialData(false);
    }
  }, [organizationInfo, adAccountInfo]);

  return (
    <AdsManagerPageBaseLayout isLoading={pageFetchingEssentialData}>
      <AccountUpdateForm
        adAccountInfo={adAccountInfo as AdAccountInfo}
        handleSubmit={handleSubmit}
        organizationInfo={organizationInfo as AdAccountOrganizationInfoResponse}
      />
    </AdsManagerPageBaseLayout>
  );
};

AdAccountCreationWizard.getPageLayout = getAccountCustomerInfoPageLayout;

export default AdAccountCreationWizard;
