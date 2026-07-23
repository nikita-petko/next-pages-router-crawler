import { useRouter } from 'next/router';
import { ReactNode } from 'react';

import ModeratedCampaignToast from '@components/billing/ModeratedCampaignToast';
import PlaceJoinRestrictedCampaignToast from '@components/billing/PlaceJoinRestrictedCampaignToast';
import StoppedAdCreditCampaignToast from '@components/billing/StoppedAdCreditCampaignToast';
import UnifiedPaymentStatusToast from '@components/billing/UnifiedPaymentStatusToast';
import DisplayNameWarningToast from '@components/common/DisplayNameWarningToast';
import { CardVerificationResultEnum } from '@constants/billing';
import { CampaignDisplayStatusType } from '@constants/campaignStatus';
import { useAppStore } from '@stores/appStoreProvider';
import { useNewFlowStore } from '@stores/newFlowStoreProvider';
import { GetLocalStorage, StorageKeys } from 'app/lite_modules/utils/localStorage';

const PageHeaderBanners = () => {
  const router = useRouter();

  const { advertisingShouldBeEnabled: advertisingEnabled } = useAppStore(
    (state) => state.advertisingShouldBeEnabled(true), // for payment status banner
  );
  const isInternal = useAppStore((state) => state.adAccountIsInternalManaged());
  const isManaged = useAppStore((state) => state.adAccountIsExternalManaged());
  const paymentProfile = useAppStore(
    (state) => state.appData?.paymentProfiles && state.appData.paymentProfiles[0],
  );
  const hasUnverifiedCard = paymentProfile ? !paymentProfile.is_verified : false; // default false
  const adCreditActivated = useAppStore((state) => state.appData.adCreditActivated || false); // default false
  const hasNoPaymentMethod = (!paymentProfile || hasUnverifiedCard) && !adCreditActivated;
  const loadingPaymentProfile = useAppStore((state) => state.getPaymentProfilesState.isLoading);
  const loadingPaymentStatus = useAppStore((state) => state.adAccountStatusState.isLoading);
  const hasFailedPayment = useAppStore(
    (state) =>
      state.appData.adAccountStatus ? state.appData.adAccountStatus.hasFailedPayment : false, // default false
  );

  const accountHasValidName = useAppStore((state) => state.appData.accountHasValidName);
  const refreshPaymentStatusToastStates = useAppStore(
    (state) => state.refreshPaymentStatusToastStates,
  );

  const campaignsState = useNewFlowStore((state) => state.campaignsState);
  const filteredIdsState = useNewFlowStore((state) => state.filteredIdsState);
  const { campaignStatuses } = useNewFlowStore((state) => state.statusesState);
  const getAdsAndOpenDrawer = useNewFlowStore((state) => state.getAdsAndOpenDrawer);

  let hasStoppedAdCreditCampaign = false;
  let firstModeratedCampaignId;
  let hasPlaceJoinRestrictedCampaign = false;
  if (!(campaignsState.isLoading || campaignsState.isError || filteredIdsState.isLoading)) {
    const { filteredCampaignIds } = filteredIdsState;
    const filteredCampaigns =
      filteredCampaignIds === undefined
        ? campaignsState.data
        : campaignsState.data.filter((row) => filteredCampaignIds.has(row.id));

    hasStoppedAdCreditCampaign = filteredCampaigns.some((campaign) => {
      const campaignStatus = campaignStatuses.get(campaign.id);
      return (
        campaignStatus?.display_status ===
        CampaignDisplayStatusType.CAMPAIGN_DISPLAY_STATUS_AUTO_PAUSED
      );
    });
    firstModeratedCampaignId =
      filteredCampaigns.find((campaign) => {
        const campaignStatus = campaignStatuses.get(campaign.id);
        return (
          campaignStatus?.display_status ===
            CampaignDisplayStatusType.CAMPAIGN_DISPLAY_STATUS_MODERATED_ACTIVE ||
          campaignStatus?.display_status ===
            CampaignDisplayStatusType.CAMPAIGN_DISPLAY_STATUS_MODERATED_INACTIVE
        );
      })?.id || '';
    hasPlaceJoinRestrictedCampaign = filteredCampaigns.some((campaign) => {
      const campaignStatus = campaignStatuses.get(campaign.id);
      return (
        campaignStatus?.display_status ===
        CampaignDisplayStatusType.CAMPAIGN_DISPLAY_STATUS_PLACE_JOIN_RESTRICTED
      );
    });
  }
  const hasClosedAdCreditBanner = GetLocalStorage(StorageKeys.HAS_CLOSED_AD_CREDIT_BANNER);
  const hasClosedModeratedCampaignBanner = GetLocalStorage(
    StorageKeys.HAS_CLOSED_MODERATED_CAMPAIGN_BANNER,
  );
  const hasClosedPlaceJoinRestrictedBanner = GetLocalStorage(
    StorageKeys.HAS_CLOSED_PLACE_JOIN_RESTRICTED_BANNER,
  );

  let showFailedCardAuthBanner = false;
  let showUnknownErrorBanner = false;
  let showSomethingWentWrongBanner = false;
  if (router.query?.state === CardVerificationResultEnum.CARD_AUTHENTICATION_FAILED) {
    showFailedCardAuthBanner = true;
  } else if (router.query?.state === CardVerificationResultEnum.UNKNOWN_STRIPE_ERROR) {
    showUnknownErrorBanner = true;
  } else if (router.query?.state === CardVerificationResultEnum.SOMETHING_WENT_WRONG) {
    showSomethingWentWrongBanner = true;
  }

  let unifiedPaymentStatusToast: ReactNode | null = null;
  const canAdvertiseWithAdCredit = adCreditActivated && advertisingEnabled;

  // Banner priority:
  // 1. Failed payment banner
  // 2. Moderated campaign banner
  // 3. Place join restricted campaign banner
  // 4. Stopped ad credit campaign banner
  if (
    !!firstModeratedCampaignId &&
    !hasClosedModeratedCampaignBanner &&
    (!hasFailedPayment || canAdvertiseWithAdCredit)
  ) {
    const handleModeratedCampaignCta = () => {
      getAdsAndOpenDrawer(firstModeratedCampaignId);
    };
    unifiedPaymentStatusToast = <ModeratedCampaignToast ctaAction={handleModeratedCampaignCta} />;
  } else if (
    hasPlaceJoinRestrictedCampaign &&
    !hasClosedPlaceJoinRestrictedBanner &&
    (!hasFailedPayment || canAdvertiseWithAdCredit)
  ) {
    unifiedPaymentStatusToast = <PlaceJoinRestrictedCampaignToast />;
  } else if (
    isManaged ||
    isInternal ||
    loadingPaymentProfile ||
    loadingPaymentStatus ||
    (canAdvertiseWithAdCredit && !hasStoppedAdCreditCampaign)
  ) {
    unifiedPaymentStatusToast = null;
  } else if (hasStoppedAdCreditCampaign && !hasClosedAdCreditBanner) {
    unifiedPaymentStatusToast = <StoppedAdCreditCampaignToast />;
  } else {
    unifiedPaymentStatusToast = (
      <UnifiedPaymentStatusToast
        failedCardAuthorization={showFailedCardAuthBanner}
        hasActiveChallenge={paymentProfile?.has_active_challenge}
        hasFailedPayment={hasFailedPayment}
        hasNoPaymentMethod={hasNoPaymentMethod}
        hasUnknownError={showUnknownErrorBanner}
        hasUnverifiedCard={hasUnverifiedCard}
        paymentProfileId={paymentProfile?.payment_profile_id}
        refreshFunc={refreshPaymentStatusToastStates}
        somethingWentWrong={showSomethingWentWrongBanner}
      />
    );
  }

  let displayNameWarningToast = null;
  if (!accountHasValidName) {
    displayNameWarningToast = <DisplayNameWarningToast />;
  }

  return (
    <div>
      <div>{unifiedPaymentStatusToast}</div>
      <div>{displayNameWarningToast}</div>
    </div>
  );
};

export default PageHeaderBanners;
