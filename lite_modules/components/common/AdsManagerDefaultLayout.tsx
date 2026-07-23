import { StatusCodes } from '@rbx/core';
import { useWorkspaces } from '@rbx/creator-hub-navigation';
import { useDetectAdBlock } from 'adblock-detect-react';
import { noop } from 'lodash';
import { useRouter } from 'next/router';
import { memo, ReactNode, useCallback, useEffect, useRef } from 'react';

import { EventName, logNativeImpressionEvent, unifiedLoggerMetadata } from '@clients/unifiedLogger';
import AlertToast from '@components/billing/AlertToast';
import useAdsManagerDefaultLayoutStyles from '@components/common/AdsManagerDefaultLayout.styles';
import CenteredCircularProgress from '@components/common/CenteredCircularProgress';
import { openAdBlockerDialog } from '@components/common/dialog/adBlockerDialog';
import { openAgeRestrictionDialog } from '@components/common/dialog/ageRestrictionDialog';
import { openErrorDialog } from '@components/common/dialog/errorDialog';
import GenericNoDataPage from '@components/common/GenericNoDataPage';
import ImpersonationBanner from '@components/common/ImpersonationBanner';
import ForecastEstimatorDrawer from '@components/forecast/ForecastEstimatorDrawer';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { StringToAlertToastLevel } from '@utils/alertToast';
import { CaptureException } from '@utils/error';
import { isGroupAdAccountMissing } from '@utils/groupAdAccountSetup';
import { getSelectedGroupId } from '@utils/groupScopedAccount';

interface AdsManagerPageBaseLayoutInputProps {
  children?: ReactNode;
  groupId?: number;
  headerSection?: ReactNode;
  isLoading: boolean;
}

const isForbiddenError = (error: unknown): boolean =>
  (error as { response?: { status?: number } })?.response?.status === StatusCodes.FORBIDDEN;

const AdsManagerPageBaseLayout = memo(
  ({
    children,
    groupId,
    headerSection = null,
    isLoading = true,
  }: AdsManagerPageBaseLayoutInputProps) => {
    const router = useRouter();
    const { translate } = useNamespacedTranslation(TranslationNamespace.Misc);
    const { currentWorkspace } = useWorkspaces();
    const currentPath = router.pathname;
    const isSplashPage = currentPath === Routes.LANDING;
    const isEmailVerifiedPage = currentPath === Routes.VERIFY_EMAIL;
    const isAdAccountAutoCreateEnabled = useAppStore(
      (state: AppStoreType) => state.appMetadataState?.data?.isAdAccountAutoCreateEnabled ?? false,
    );
    const selectedGroupId = getSelectedGroupId(currentWorkspace, isAdAccountAutoCreateEnabled);
    const activeGroupId = isAdAccountAutoCreateEnabled ? (groupId ?? selectedGroupId) : undefined;
    const adAccountStatusGroupId = isAdAccountAutoCreateEnabled ? groupId : undefined;
    const activeGroupScopedAccountState = useAppStore((state: AppStoreType) =>
      activeGroupId ? state.groupScopedAccountStateByGroupId[activeGroupId] : undefined,
    );
    const groupPermissionDenied =
      activeGroupScopedAccountState?.advertiserState?.errorStatus === StatusCodes.FORBIDDEN;
    const { adAccountId, statusBannerMessage, userOver13, userOver18 } = useAppStore(
      (state: AppStoreType) => state.appData,
    );
    const { canUserImpersonate } = useAppStore(
      (state: AppStoreType) => state.appMetadataState.data,
    );
    const {
      setAdCreditActivated,
      setAdCreditBalance,
      setPaymentFailure,
      setPaymentProfiles,
      setProfileNotVerified,
    } = useAppStore();

    const statusBannerMessageLevel = useAppStore(
      (state: AppStoreType) => state.appMetadataState?.data?.statusBannerMessageLevel,
    );

    const getAdCredit = useAppStore((state: AppStoreType) => state.getAdCredit);
    const getAdAccountStatus = useAppStore((state: AppStoreType) => state.getAdAccountStatus);
    const getAdvertiser = useAppStore((state: AppStoreType) => state.getAdvertiser);
    const getPaymentProfiles = useAppStore((state: AppStoreType) => state.getPaymentProfiles);
    const isForecastEstimatorEnabled = useAppStore(
      (s) => s.appMetadataState?.data?.isForecastEstimatorEnabled ?? false,
    );

    const adBlockDetected = useDetectAdBlock();
    const loggedMissingGroupAccountPageKeys = useRef<Set<string>>(new Set());

    useEffect(() => {
      if (adBlockDetected) {
        unifiedLoggerMetadata.setAdBlockerStatus(adBlockDetected);
        unifiedLoggerMetadata.logAdBlockerIsOn(adBlockDetected);
        openAdBlockerDialog();
      }
    }, [adBlockDetected]);

    useEffect(() => {
      let isCurrentGroupRequest = true;

      if (activeGroupId && !groupPermissionDenied) {
        getAdvertiser(false, activeGroupId).catch((error: unknown) => {
          const isForbidden = isForbiddenError(error);
          if (isCurrentGroupRequest && !isForbidden) {
            CaptureException(error as Error);
          }
        });
      }

      return () => {
        isCurrentGroupRequest = false;
      };
    }, [activeGroupId, getAdvertiser, groupPermissionDenied]);

    useEffect(() => {
      const advertiserState = activeGroupScopedAccountState?.advertiserState;
      if (!activeGroupId || !isGroupAdAccountMissing(advertiserState)) {
        return;
      }

      const pageKey = `${activeGroupId}:${currentPath}`;
      if (loggedMissingGroupAccountPageKeys.current.has(pageKey)) {
        return;
      }

      loggedMissingGroupAccountPageKeys.current.add(pageKey);
      logNativeImpressionEvent(EventName.GroupAdAccountMissingPageLoaded, {
        groupId: String(activeGroupId),
        page: currentPath,
      });
    }, [activeGroupId, activeGroupScopedAccountState?.advertiserState, currentPath]);

    useEffect(() => {
      // if user land on splash page, we don't need to check payment error
      if (!groupPermissionDenied && !isSplashPage && adAccountId) {
        getAdAccountStatus(adAccountStatusGroupId)
          .then((resp) => {
            if (!adAccountStatusGroupId) {
              setPaymentFailure(resp?.hasFailedPayment);
              setProfileNotVerified(resp?.profileNotVerified);
            }
          })
          .catch(noop);

        getPaymentProfiles(true)
          .then((paymentProfilesResponse) => {
            setPaymentProfiles(paymentProfilesResponse?.data || []);
          })
          .catch(noop);

        getAdCredit()
          .then((getAdCreditBalanceResponse) => {
            setAdCreditBalance(getAdCreditBalanceResponse?.ad_credit_balance_in_micro || 0);
            setAdCreditActivated(getAdCreditBalanceResponse?.is_account_activated || false);
          })
          .catch(noop);
      }

      // If this birthday 13+ years old check call fails we show a generic error - if it returns false then show the 13+ error.
      if (userOver13 === false) {
        openAgeRestrictionDialog();
      } else if (userOver13 === null && !isSplashPage && !isEmailVerifiedPage) {
        // This will be null if the user is not logged in.
        // If the user is not logged in we don't want to show an error modal on the splash page.
        // The verify email link can be opened from any browser (even if the user is not logged in) so we want to avoid showing an error modal there too).
        openErrorDialog();
      }
    }, [
      userOver18,
      userOver13,
      groupPermissionDenied,
      isSplashPage,
      adAccountId,
      isEmailVerifiedPage,
      getAdAccountStatus,
      adAccountStatusGroupId,
      getPaymentProfiles,
      getAdCredit,
      setPaymentFailure,
      setProfileNotVerified,
      setPaymentProfiles,
      setAdCreditBalance,
      setAdCreditActivated,
    ]);

    const {
      classes: { creatorHubLayoutPageContent, systemWideAlertToast },
    } = useAdsManagerDefaultLayoutStyles();

    const systemWideAlert = useCallback(
      () => (
        <section className={systemWideAlertToast} data-testid='outage-toast'>
          <AlertToast
            header=''
            level={StringToAlertToastLevel(statusBannerMessageLevel || '')}
            text={statusBannerMessage}
          />
        </section>
      ),
      [statusBannerMessageLevel, statusBannerMessage, systemWideAlertToast],
    );

    const pageContent = groupPermissionDenied ? (
      <GenericNoDataPage
        iconName='icon-filled-lock-closed'
        subtitle={translate('Description.GroupAdsManagerPermissionDenied')}
        title={translate('Heading.PermissionDenied')}
      />
    ) : (
      children
    );

    return (
      <div className={creatorHubLayoutPageContent}>
        {isForecastEstimatorEnabled ? <ForecastEstimatorDrawer /> : null}
        {statusBannerMessage ? systemWideAlert() : null}
        {canUserImpersonate ? <ImpersonationBanner /> : null}
        {groupPermissionDenied ? null : headerSection}
        {groupPermissionDenied || !isLoading ? pageContent : <CenteredCircularProgress />}
      </div>
    );
  },
);

export default AdsManagerPageBaseLayout;
