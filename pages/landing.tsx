import { useRouter } from 'next/router';
import { PropsWithChildren, ReactNode, useCallback, useEffect, useState } from 'react';

import { EventName, unifiedLogger } from '@clients/unifiedLogger';
import AdsManagerPageBaseLayout from '@components/common/AdsManagerDefaultLayout';
import { getCreatorHubPageLayout } from '@components/common/CreatorHubPageLayout';
import { openErrorDialog } from '@components/common/dialog/errorDialog';
import GenericSnackBar from '@components/common/GenericSnackBar';
import AutoCreateLandingPage from '@components/onboarding/AutoCreateLandingPage';
import LandingPageComponent from '@components/onboarding/LandingPageComponent';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import usePollEmailVerification from '@hooks/account/usePollEmailVerification';
import { useForecastEstimatorDrawerUrl } from '@hooks/useForecastEstimatorDrawerUrl';
import { useIsLoggedIn } from '@hooks/useIsLoggedIn';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { getAuthorizationEndpoint } from '@services/auth/appAuthDataService';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { GetLocalStorage, StorageKeys } from '@utils/localStorage';

const LandingPageLayoutSwitcher = ({ children }: PropsWithChildren) =>
  getCreatorHubPageLayout(children, {
    headerKey: 'Label.AdsManager',
    headerNamespace: TranslationNamespace.Navigation,
    rail: null,
  });

const LandingPage = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Account);
  const accountIdFromLocalStorage = GetLocalStorage(StorageKeys.AD_ACCOUNT_ID);
  const organizationIdFromLocalStorage = GetLocalStorage(StorageKeys.ORGANIZATION_ID);
  const [pageFetchingEssentialData, setPageFetchingEssentialData] = useState<boolean>(true);
  const {
    adAccountId = accountIdFromLocalStorage,
    hasVerifiedEmail,
    organizationId = organizationIdFromLocalStorage,
    userOver13,
  } = useAppStore((state: AppStoreType) => state.appData);
  const isAdAccountAutoCreateEnabled = useAppStore(
    (state: AppStoreType) => state.appMetadataState?.data?.isAdAccountAutoCreateEnabled ?? false,
  );

  const router = useRouter();
  const isForecastEstimatorEnabled = useAppStore(
    (state: AppStoreType) => state.appMetadataState?.data?.isForecastEstimatorEnabled ?? false,
  );
  const { open: openForecastEstimator } = useForecastEstimatorDrawerUrl();
  const { isFromSuccessfulEmailVerification = false } = router.query;

  const [adAccountAttachedToThisRobloxUser, setAdAccountAttachedToThisRobloxUser] =
    useState<boolean>(false);
  const userIsLoggedIn = useIsLoggedIn();
  const showAutoCreateLanding =
    isAdAccountAutoCreateEnabled && userIsLoggedIn && !adAccountAttachedToThisRobloxUser;
  const shouldPollEmailVerification = showAutoCreateLanding && hasVerifiedEmail !== true;
  usePollEmailVerification(shouldPollEmailVerification);

  useEffect(() => {
    unifiedLogger.trackPageLoad();
  }, []);

  useEffect(() => {
    const isAdAccountAttachedToThisRobloxUser = Boolean(adAccountId);
    setAdAccountAttachedToThisRobloxUser(isAdAccountAttachedToThisRobloxUser);
    if ((adAccountId && organizationId) || !adAccountAttachedToThisRobloxUser) {
      setPageFetchingEssentialData(false);
    }
    if (isAdAccountAttachedToThisRobloxUser) {
      router.push(Routes.HOME);
    }
  }, [adAccountId, organizationId]); // eslint-disable-line react-hooks/exhaustive-deps

  const onLegacyButtonClicked = () => {
    unifiedLogger.logClickEvent({ eventName: EventName.CreateAdAccountPageClickCreationStart });

    if (!userIsLoggedIn) {
      getAuthorizationEndpoint()
        .then((authUrl) => {
          window.location.assign(authUrl);
        })
        .catch(() => {
          openErrorDialog();
        });
    } else if (!adAccountAttachedToThisRobloxUser) {
      router.push(Routes.CREATE_ACCOUNT);
    } else if (adAccountAttachedToThisRobloxUser) {
      router.push(Routes.HOME);
    }
  };

  const onAutoCreateGetStartedClick = useCallback(() => {
    unifiedLogger.logClickEvent({ eventName: EventName.CreateAdAccountPageClickCreationStart });
    router.push(Routes.MANAGE);
  }, [router]);

  const onForecastEstimatorClick = useCallback(() => {
    unifiedLogger.logClickEvent({
      eventName: EventName.ForecastEstimatorDrawerOpenedFromLandingButton,
    });
    openForecastEstimator();
  }, [openForecastEstimator]);

  const getStartedDisabled = !userOver13 || hasVerifiedEmail !== true;

  return (
    <AdsManagerPageBaseLayout isLoading={pageFetchingEssentialData}>
      {isFromSuccessfulEmailVerification && (
        <GenericSnackBar message={translate('Message.EmailVerified')} severity='success' />
      )}
      {showAutoCreateLanding ? (
        <AutoCreateLandingPage
          getStartedDisabled={getStartedDisabled}
          hasVerifiedEmail={hasVerifiedEmail === true}
          onGetStartedClick={onAutoCreateGetStartedClick}
        />
      ) : (
        <LandingPageComponent
          buttonDisabled={userIsLoggedIn && !userOver13}
          buttonOnClick={onLegacyButtonClicked}
          buttonText={translate('Action.CreateAdAccount')}
          isForecastEstimatorEnabled={isForecastEstimatorEnabled && userIsLoggedIn}
          onForecastEstimatorClick={onForecastEstimatorClick}
        />
      )}
    </AdsManagerPageBaseLayout>
  );
};

LandingPage.getPageLayout = (page: ReactNode) => (
  <LandingPageLayoutSwitcher>{page}</LandingPageLayoutSwitcher>
);

export default LandingPage;
