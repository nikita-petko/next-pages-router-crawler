import '@styles/globals.css';
import '@utils/sentry';
import { CookieConsentBanner, CookieConsentProvider } from '@rbx/cookie-banner';
import { NavigationConfigsProvider } from '@rbx/creator-hub-navigation';
import { createThumbnailsClient } from '@rbx/thumbnails';
import { CacheProvider, createCache, removeServerSideCSS, TCache } from '@rbx/ui';
import { UnifiedLoggerProvider } from '@rbx/unified-logger/react';
import { createWebVitalsReporter } from '@rbx/web-vitals';
import { ErrorBoundary } from '@sentry/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosError, HttpStatusCode } from 'axios';
import moment from 'moment';
import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useReportWebVitals } from 'next/web-vitals';
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { setupAxiosInterceptors } from '@clients/axiosInterceptors';
import cookieBasedAuthClient from '@clients/cookieBasedAuth';
import cookieBasedUsersClient from '@clients/cookieBasedUsers';
import { primeCsrfToken } from '@clients/csrfTokenStore';
import { initCueing } from '@clients/cueingIntegration';
import { EventName, unifiedLogger } from '@clients/unifiedLogger';
import AuthenticationProvider from '@components/auth/AuthenticationProvider';
import CookieBasedAuthenticationManager from '@components/auth/CookieBasedAuthenticationManager';
import RobloxAuthenticationProvider from '@components/auth/RobloxAuthenticationProvider';
import CenteredCircularProgress from '@components/common/CenteredCircularProgress';
import { getCreatorHubPageLayout } from '@components/common/CreatorHubPageLayout';
import DialogOutlet from '@components/common/dialog/outlet';
import ModalContext from '@components/common/ModalContext';
import PageHead from '@components/common/PageHead';
import DevToolsDock from '@components/devtools/DevToolsDock';
import LocaleProvider from '@components/locale/LocaleProvider';
import TranslationLocalizationProvider from '@components/locale/TranslationLocalizationProvider';
import MetadataOverridesTool from '@components/metadataOverrides/MetadataOverridesTool';
import VerifyEmailComponent from '@components/onboarding/VerifyEmailComponent';
import ErrorCodes from '@constants/errorCodes';
import Routes from '@constants/routes';
import { studioResources, StudioResourcesProvider } from '@modules/miscellaneous/hooks/useStudio';
import ModeResponsiveThemeProvider from '@modules/theme/hooks/ModeResponsiveThemeProvider';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { IsLocalDeveloperToolsEnvEnabled, IsMSWMockResponsesEnabled } from '@utils/env';
import { CaptureException } from '@utils/error';
import {
  GetLocalStorage,
  RemoveLocalStorage,
  SetLocalStorage,
  StorageKeys,
} from '@utils/localStorage';
import { SetupMockHandlers, UnregisterMockServiceWorker } from '@utils/mswWorker';
import { GetBEDEV1ServiceBasePath, GetSitetestBaseUrl } from '@utils/url';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
    },
  },
});

const loggerConfig = {
  rosId: 3203,
};

const clientSideEmotionCache = createCache();

const authenticationManager = new CookieBasedAuthenticationManager(
  cookieBasedAuthClient,
  cookieBasedUsersClient,
);

createThumbnailsClient(GetBEDEV1ServiceBasePath('thumbnails'));

// Dynamic import to avoid bundling the DeveloperTools component in the production bundle
const DeveloperTools =
  process.env.NEXT_PUBLIC_ENABLE_LOCAL_DEV_TOOLS === 'true'
    ? dynamic(() => import('@components/devtools/DeveloperTools'), { ssr: false })
    : () => null;

const getAppPageLayout = (page: ReactNode) => getCreatorHubPageLayout(page);

interface AdsComponentProps {
  getPageLayout?: () => ReactNode;
}

function AdsCreationAndManagementApp({
  cache = clientSideEmotionCache,
  Component,
  pageProps,
}: AppProps & { Component: AdsComponentProps; cache?: TCache }) {
  const [mocksReady, setMocksReady] = useState<boolean>(!IsMSWMockResponsesEnabled());
  const maybeInitMocks = async () => {
    if (IsMSWMockResponsesEnabled()) {
      // eslint-disable-next-line no-console
      console.log(
        'MSW Mock responses enabled for testing environment. Mocking API responses. This should not be used in production.',
      );
      try {
        // Await the worker setup/start to ensure it's ready
        await SetupMockHandlers();
        // eslint-disable-next-line no-console
        console.log('MSW worker is ready and handlers are active.');
        setMocksReady(true);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to start MSW worker:', error);
      }
    } else if (IsLocalDeveloperToolsEnvEnabled()) {
      // Not running MSW, but a previous `dev:msw` run may have left its service
      // worker registered. It survives server restarts and intercepts every
      // request once MSW is gone, breaking auth/translations. Clean it up so
      // non-MSW dev servers load normally.
      await UnregisterMockServiceWorker();
    }
  };

  useEffect(() => {
    initCueing();
    setupAxiosInterceptors();
    primeCsrfToken();
    maybeInitMocks();
  }, []);
  useReportWebVitals(createWebVitalsReporter(unifiedLogger));
  const customGetPageLayout = Component?.getPageLayout;

  const getPageLayout = customGetPageLayout || getAppPageLayout;

  const router = useRouter();

  const getAccountMetadata = useAppStore((state: AppStoreType) => state.getAccountMetadata);

  const hasLoggedManagePageEvent = useRef<boolean>(false);
  const [showContent, setShowContent] = useState<boolean>(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [essentialAppData, setEssentialAppData] = useState<any>();
  const [showVerifyEmail, setShowVerifyEmail] = useState<boolean>(false);

  const getAdvertiser = useAppStore((state: AppStoreType) => state.getAdvertiser);
  const getCurrentUser = useAppStore((state: AppStoreType) => state.getCurrentUser);
  const getUserBirthday = useAppStore((state: AppStoreType) => state.getUserBirthday);
  const getEmailVerified = useAppStore((state: AppStoreType) => state.getEmailVerified);
  const setIsAdAccountBlocked = useAppStore((state: AppStoreType) => state.setIsAdAccountBlocked);
  const isAdAccountBlocked = useAppStore((state: AppStoreType) => state.appData.isAdAccountBlocked);

  const fetchAdsMetadata = useCallback(async () => {
    try {
      await getAccountMetadata();
    } catch {
      // Do nothing
    }
  }, [getAccountMetadata]);

  const fetchEssentialInfo = useCallback(async () => {
    let adAccountId;
    let organizationId;
    let organizationInfo;
    let adAccountInfo;
    let adAccountPrepaidBalance;
    let campaignLimit;
    let adSetLimit;
    let adLimit;
    let isCampaignLimitMax;

    const currentUser = await getCurrentUser().catch((e: AxiosError) => {
      if (!e.response?.data) {
        unifiedLogger.logErrorEvent({
          eventName: EventName.GetCurrentUserError,
          parameters: {
            response: JSON.stringify(e.response),
          },
        });
      } else if (e.response?.status !== HttpStatusCode.Unauthorized) {
        CaptureException(e as Error);
      }
    });
    if (!currentUser) {
      const fetchedEssentialAppData = {
        adAccountId,
        adAccountInfo,
        adAccountPrepaidBalance:
          adAccountPrepaidBalance == null ? 0 : adAccountPrepaidBalance / 1000000, // type checker assurance
        adLimit,
        adSetLimit,
        campaignLimit,
        currentUser,
        hasVerifiedEmail: false,
        isCampaignLimitMax,
        organizationId,
        organizationInfo,
        userOver13: null,
        userOver18: null,
      };

      setEssentialAppData(fetchedEssentialAppData);

      return fetchedEssentialAppData;
    }

    let userOver18 = null;
    let userOver13 = null;

    try {
      const userBirthdayResponse = await getUserBirthday();
      const { birthDay, birthMonth, birthYear } = userBirthdayResponse;
      if (!birthMonth || !birthDay || !birthYear) {
        userOver18 = null;
        userOver13 = null;
      } else {
        const eighteenthBirthday = moment(`${birthMonth}/${birthDay}/${birthYear}`).add(
          18,
          'years',
        );
        userOver18 = eighteenthBirthday <= moment(Date.now());
        const thirteenthBirthday = moment(`${birthMonth}/${birthDay}/${birthYear}`).add(
          13,
          'years',
        );
        userOver13 = thirteenthBirthday <= moment(Date.now());
      }
    } catch (e) {
      userOver18 = null;
      userOver13 = null;
      CaptureException(e as Error);
    }

    // Under 13 users cannot use ads manager, do not attempt to fetch advertiser information
    if (userOver13) {
      try {
        const advertiserResponse = await getAdvertiser();
        const {
          ad_account,
          ad_account_prepaid_balance = 0,
          entity_limits,
          organization,
        } = advertiserResponse || {}; // Default to 0 if it's not there so we don't get a error when we divide by 1000000 later
        organizationId = organization?.id;
        organizationInfo = organization;
        adAccountId = ad_account?.id;
        adAccountInfo = ad_account;
        campaignLimit = entity_limits?.campaign_limit;
        adSetLimit = entity_limits?.ad_set_limit;
        adLimit = entity_limits?.ad_limit;
        isCampaignLimitMax = entity_limits?.is_campaign_limit_max;
        adAccountPrepaidBalance = ad_account_prepaid_balance;
        // Expire in 7 days
        if (organizationId) {
          SetLocalStorage(StorageKeys.ORGANIZATION_ID, organizationId, 604800);
        }
        // Expire in 7 days
        if (adAccountId) {
          SetLocalStorage(StorageKeys.AD_ACCOUNT_ID, adAccountId, 604800);
        }
      } catch (error) {
        // Hits this if any non 200 comes back
        organizationId = null;
        adAccountId = null;
        if (
          error instanceof AxiosError &&
          (error.response?.data?.error?.code === ErrorCodes.ORGANIZATION_NOT_FOUND ||
            error.response?.data?.error?.code === ErrorCodes.AD_ACCOUNT_NOT_FOUND)
        ) {
          // No organization or ad account attached to this account - do nothing
        } else if (
          error instanceof AxiosError &&
          error.response?.data?.error?.code === ErrorCodes.AD_ACCOUNT_BLOCKED
        ) {
          setIsAdAccountBlocked(true);
        } else if (error instanceof AxiosError && error.response?.data?.errors?.length) {
          // If authorization failed on api gateway level, it will return list of errors instead of error
          // This happens when user is not logged in yet - do nothing
        }
      }
    } else {
      organizationId = null;
      adAccountId = null;
    }

    // Normalize undefined to null so the destructuring default in the
    // routing callback doesn't fall back to a stale localStorage value
    if (adAccountId === undefined) {
      adAccountId = null;
    }

    const isAdAccountAutoCreateEnabled =
      useAppStore.getState().appMetadataState?.data?.isAdAccountAutoCreateEnabled ?? false;
    const skipEmailVerification = isAdAccountAutoCreateEnabled && !adAccountId;

    let hasVerifiedEmail = null;
    try {
      const verifyEmailResponse = await getEmailVerified();
      const { verified } = verifyEmailResponse || {};
      hasVerifiedEmail = verified;
      if (!skipEmailVerification) {
        setShowVerifyEmail(!verified);
      }
    } catch (e) {
      hasVerifiedEmail = null;
      if (!skipEmailVerification) {
        setShowVerifyEmail(true);
      }

      // 401 refers to the user email is not verified, do not send this error to sentry
      if (
        (e as { response?: { status: number } })?.response?.status === HttpStatusCode.Unauthorized
      ) {
        // Do nothing
      } else {
        CaptureException(e as Error);
      }
    }

    const fetchedEssentialAppData = {
      adAccountId,
      adAccountInfo,
      adAccountPrepaidBalance:
        adAccountPrepaidBalance == null ? 0 : adAccountPrepaidBalance / 1000000, // type checker assurance
      adLimit,
      adSetLimit,
      campaignLimit,
      currentUser,
      hasVerifiedEmail,
      isCampaignLimitMax,
      organizationId,
      organizationInfo,
      userOver13,
      userOver18,
    };

    setEssentialAppData(fetchedEssentialAppData);

    return fetchedEssentialAppData;
  }, [getAdvertiser, getCurrentUser, getEmailVerified, getUserBirthday, setIsAdAccountBlocked]);

  useEffect(() => {
    unifiedLogger.trackPageLoad();
  }, []);

  useEffect(() => {
    removeServerSideCSS();
    if (!mocksReady || !router.isReady) {
      return;
    }

    const currentPath = router.pathname;
    const isSplashPage = currentPath === Routes.LANDING;
    const isCreateAdAccountPage = currentPath === Routes.CREATE_ACCOUNT;
    const isEmailVerifiedPage = currentPath === Routes.VERIFY_EMAIL;
    const isImpersonatePage = currentPath === Routes.IMPERSONATE;

    // Needs to happen before getAdvertiser (fetchEssentialInfo) for Max Campaign Budget logic to work
    const loadApp = async () => {
      try {
        await fetchAdsMetadata();
      } catch (error) {
        CaptureException(error as Error);
      }

      return fetchEssentialInfo();
    };

    loadApp().then((fetchedEssentialAppData) => {
      // eslint-disable-next-line prefer-const
      let { adAccountId = GetLocalStorage(StorageKeys.AD_ACCOUNT_ID), currentUser } =
        fetchedEssentialAppData;

      const userIsLoggedIn = Boolean((currentUser || {}).id);
      const userIsLoggedOut = userIsLoggedIn === false;

      if (userIsLoggedOut) {
        RemoveLocalStorage(StorageKeys.AD_ACCOUNT_ID);
        RemoveLocalStorage(StorageKeys.ORGANIZATION_ID);
        adAccountId = undefined;
        setEssentialAppData({
          ...essentialAppData,
          adAccountId: undefined,
          organizationId: undefined,
        });
      }

      const robloxAccountHasNoAttachedAdvertiserAccount = !adAccountId;

      if (userIsLoggedOut) {
        unifiedLogger.logImpressionEvent({ eventName: EventName.LoadPageLoggedOut });
      } else if (robloxAccountHasNoAttachedAdvertiserAccount) {
        unifiedLogger.logImpressionEvent({
          eventName: EventName.LoadPageLoggedInWithoutAdAccount,
        });
      } else {
        unifiedLogger.logImpressionEvent({
          eventName: EventName.LoadPageLoggedInWithAdAccount,
          parameters: {
            adAccountId,
            adSetsSortKey: GetLocalStorage('adsets_orderBy', ''),
            adsSortKey: GetLocalStorage('ads_orderBy', ''),
            campaignsSortKey: GetLocalStorage('campaigns_orderBy', ''),
            newflowAdsSortKey: GetLocalStorage('trafficDriving_ads_orderBy', ''),
            newflowCampaignsSortKey: GetLocalStorage('trafficDriving_campaigns_orderBy', ''),
          },
        });
      }

      const isAdAccountAutoCreateEnabled =
        useAppStore.getState().appMetadataState?.data?.isAdAccountAutoCreateEnabled ?? false;

      // ORDER MATTERS BELOW:
      // The navigations below also need to be hard navigations (not router.push) to avoid issues with cached state values during navigations which previously caused redirect loops.
      // robloxAccountHasNoAttachedAdvertiserAccount will always be true if the user is logged out. The userIsLoggedOut variable below is for human readibility.
      if (robloxAccountHasNoAttachedAdvertiserAccount) {
        if (userIsLoggedIn && isAdAccountAutoCreateEnabled) {
          // Auto-create flow: skip full-page email verification gate — unverified
          // users see an inline banner on /landing instead
          setShowVerifyEmail(false);
          const { hasVerifiedEmail } = fetchedEssentialAppData;
          const isBillingOrAccountPage = [
            Routes.CLASSIC,
            Routes.PAYMENT_SETTINGS,
            Routes.PAYMENT_ACTIVITY,
            Routes.ADD_PAYMENT,
            Routes.ACCOUNT_OVERVIEW,
          ].includes(currentPath as Routes);
          const isAllowedAutoCreatePage = [
            Routes.LANDING,
            Routes.MANAGE,
            Routes.CREATIVE_LIBRARY,
            Routes.AD_INTEGRATIONS,
          ].includes(currentPath as Routes);

          if (isImpersonatePage) {
            setShowContent(true);
          } else if (isCreateAdAccountPage || isBillingOrAccountPage) {
            router.push(Routes.MANAGE);
            setShowContent(false);
          } else if (currentPath === Routes.MANAGE && hasVerifiedEmail !== true) {
            router.push(Routes.LANDING);
            setShowContent(false);
          } else if (isAllowedAutoCreatePage) {
            if (currentPath === Routes.MANAGE && !hasLoggedManagePageEvent.current) {
              hasLoggedManagePageEvent.current = true;
              unifiedLogger.logImpressionEvent({
                eventName: EventName.NewUserFlowManagePageLoaded,
              });
            }
            setShowContent(true);
          } else {
            router.push(Routes.LANDING);
            setShowContent(false);
          }
        } else {
          switch (true) {
            // If the user is logged out - they should NOT be able to navigate to the account creation page
            case userIsLoggedOut && isCreateAdAccountPage:
              router.push(Routes.LANDING);
              break;
            // user should be able to load verify page whether it is login or not (not the enter email to verify page)
            case isEmailVerifiedPage:
              setShowVerifyEmail(false);
              setShowContent(true);
              break;
            case userIsLoggedOut && isSplashPage:
              setShowVerifyEmail(false);
              setShowContent(true);
              break;
            case userIsLoggedOut:
              router.push(Routes.LANDING);
              // Still need to set this because redirection takes a second so we want to keep the loading spinner going.
              setShowVerifyEmail(false);
              setShowContent(false);
              break;
            case userIsLoggedIn && isSplashPage:
              setShowVerifyEmail(false);
              setShowContent(true);
              break;
            // User is logged in - whitelisted pages to see without an ad account
            case userIsLoggedIn && isCreateAdAccountPage:
            case userIsLoggedIn && isImpersonatePage:
              setShowContent(true);
              break;
            // User is logged in without an attached ad account - all other pages redirect to the landing page if no ad account is present
            case userIsLoggedIn:
              router.push(Routes.LANDING);
              // Still need to set this because redirection takes a second so we want to keep the loading spinner going.
              setShowVerifyEmail(false);
              setShowContent(false);
              break;
            // User's ad account has been manually blocked by us, redirect to home page
            // A banner will be shown indicating actions they can take
            // Today this is only used for external managed accounts with insufficient spend
            case isAdAccountBlocked:
              router.push(Routes.HOME);
              setShowContent(true);
              break;
            default:
              setShowContent(true);
              // router.push(Routes.LANDING);
              break;
          }
        }
      } else {
        // If the advertiser has an ad account attached to their roblox account render everything normally
        setShowContent(true);
        // for backward compatibility, existing accounts with no verified email
        // will need to land on the page to get the email verified
        if (isEmailVerifiedPage) {
          setShowVerifyEmail(false);
        }
      }
    });
  }, [router.isReady, router.pathname, mocksReady, isAdAccountBlocked]); // eslint-disable-line react-hooks/exhaustive-deps

  const path = useMemo(() => {
    if (!router.pathname || typeof window === 'undefined') {
      return undefined;
    }
    return `${window.location.origin}${process.env.siteBasePath}${router.pathname}`;
  }, [router.pathname]);

  const renderMayContent = () =>
    showContent ? (
      <ModalContext>
        {showVerifyEmail && <VerifyEmailComponent />}
        {!showVerifyEmail && getPageLayout(<Component {...pageProps} />)}
      </ModalContext>
    ) : (
      <ModalContext>
        <CenteredCircularProgress />
      </ModalContext>
    );

  return (
    <CacheProvider cache={cache}>
      <ErrorBoundary>
        <ModeResponsiveThemeProvider
          themeElement={typeof document !== 'undefined' ? document.documentElement : undefined}>
          <LocaleProvider>
            <QueryClientProvider client={queryClient}>
              <TranslationLocalizationProvider>
                <CookieConsentProvider robloxSiteDomain={GetSitetestBaseUrl()}>
                  <RobloxAuthenticationProvider>
                    <UnifiedLoggerProvider
                      pageLoggerConfig={loggerConfig}
                      path={path}
                      unifiedLogger={unifiedLogger}>
                      <AuthenticationProvider manager={authenticationManager}>
                        <NavigationConfigsProvider
                          currentProduct='Advertise'
                          environment={process.env.environment}
                          target='global'>
                          <StudioResourcesProvider resources={studioResources}>
                            <PageHead />
                            {renderMayContent()}
                            {/* DialogOutlet is the mount point for the new
                                foundation-ui dialog system (useDialogStore +
                                openDialog). It's intentionally a sibling of
                                ModalContext (the legacy MUI modal mount) — the
                                two systems are independent and run in parallel
                                during the per-modal migration. */}
                            <DialogOutlet />
                            <DevToolsDock>
                              <MetadataOverridesTool />
                              <DeveloperTools />
                            </DevToolsDock>
                            <CookieConsentBanner />
                          </StudioResourcesProvider>
                        </NavigationConfigsProvider>
                      </AuthenticationProvider>
                    </UnifiedLoggerProvider>
                  </RobloxAuthenticationProvider>
                </CookieConsentProvider>
              </TranslationLocalizationProvider>
            </QueryClientProvider>
          </LocaleProvider>
        </ModeResponsiveThemeProvider>
      </ErrorBoundary>
    </CacheProvider>
  );
}

export default AdsCreationAndManagementApp;
