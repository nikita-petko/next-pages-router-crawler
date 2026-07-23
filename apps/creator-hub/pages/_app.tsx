import 'promise-polyfill/src/polyfill';
import '@formatjs/intl-relativetimeformat/polyfill';
import '@rbx/webfont';
import '../styles/globals.css';
import React, { type FunctionComponent, useEffect, useMemo } from 'react';
import type { NextComponentType, NextGetPageLayout } from 'next';
import type { AppContext, AppInitialProps, AppLayoutProps } from 'next/app';
import { useRouter } from 'next/router';
import { useReportWebVitals } from 'next/web-vitals';
import { ErrorBoundary } from '@sentry/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initializeAuthStore } from '@rbx/auth';
import { CookieConsentProvider } from '@rbx/cookie-banner';
import { useMaintenanceObserver } from '@rbx/creator-hub-error';
import { NavigationConfigsProvider } from '@rbx/creator-hub-navigation';
import { LocalizationProvider } from '@rbx/intl';
import { createThumbnailsClient, ThumbnailsProvider } from '@rbx/thumbnails';
import {
  CacheProvider,
  createCache,
  SnackbarProvider,
  DialogProvider,
  removeServerSideCSS,
} from '@rbx/ui';
import { createWebVitalsReporter } from '@rbx/web-vitals';
import { AgeVerificationUpsellProvider } from '@modules/age-verification-upsell/context/AgeVerificationUpsellContext';
import { AuthenticationProvider } from '@modules/authentication/providers';
import { ApplicationAuthorizationsClient } from '@modules/clients/applicationAuthorization';
import { AuthClient } from '@modules/clients/auth';
import { UsersClient } from '@modules/clients/users';
import { getBEDEV1ServiceBasePath } from '@modules/clients/utils';
import AuthenticatedThemeModeProvider from '@modules/creator-settings/hooks/AuthenticatedThemeModeProvider';
import CreatorNotificationsSettingsProvider from '@modules/creator-settings/hooks/CreatorNotificationsSettingsContext';
import ModeResponsiveThemeProvider from '@modules/creator-settings/hooks/ModeResponsiveThemeProvider';
import { EventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import trackerClient, { eventStreamBaseUrl } from '@modules/eventStream/tracker';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { useCustomDashboardServiceSubscription } from '@modules/experience-analytics/custom-dashboards/hooks/useServiceSubscription';
import {
  CustomDashboardServiceProvider,
  UniverseFlaggedCustomDashboardProvider,
} from '@modules/experience-analytics/custom-dashboards/service/CustomDashboardServiceProvider';
import FeatureFlagLocalOverrideWidget from '@modules/feature-flag-local-overrides/FeatureFlagLocalOverrideWidget';
import OrganizationProvider from '@modules/group/providers/OrganizationProvider';
import MultiProvider from '@modules/miscellaneous/components/MultiProvider/MultiProvider';
import {
  ThemeAwareStudioResourcesProvider,
  usePageEventsTracker,
} from '@modules/miscellaneous/hooks';
import { UnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import {
  TranslationResourceProvider,
  defaultLocale,
  defaultNativeName,
  fallbackLocale,
  defaultMetadataJson,
} from '@modules/miscellaneous/localization';
import { MetricsMonitoringProvider } from '@modules/miscellaneous/metricsMonitoring';
import { PageHead } from '@modules/miscellaneous/pageMetadata';
import ModerationOverlay from '@modules/moderation/components/ModerationOverlay';
import { DialogOutlet as MonetizationDialogOutlet } from '@modules/monetization-shared/dialog/outlet';
import { SnackbarOutlet as MonetizationSnackbarOutlet } from '@modules/monetization-shared/snackbar/outlet';
import { BreadcrumbItemNameProvider } from '@modules/navigation/layout/contexts/BreadcrumbItemNameContext';
import { LeftNavigationStateProvider } from '@modules/navigation/layout/hooks/LeftNavigationStateContext';
import getNavigationEnvironment from '@modules/navigation/utils/getNavigationEnvironment';
import { GroupsProvider } from '@modules/providers/groups/GroupsProvider';
import { SettingsProvider, useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import UserAgreementCheck from '@modules/user-agreements/components/UserAgreementCheck';

const { authenticationApi } = AuthClient;
const { discoveryApi } = ApplicationAuthorizationsClient;
const { usersApi } = UsersClient;

// reports custom NextJS metrics (Next.js-hydration, Next.js-route-change-to-render, Next.js-render)
export const reportWebVitals = createWebVitalsReporter(unifiedLoggerClient);

// NOTE: (jcountryman, 10/04/22): Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createCache();

/** Based on https://github.com/vercel/next.js/discussions/18502 */
type CustomAppFC = NextComponentType<AppContext, AppInitialProps, AppLayoutProps>;

createThumbnailsClient(getBEDEV1ServiceBasePath('thumbnails'));

const defaultLocaleInfo = {
  locale: defaultLocale,
  nativeName: defaultNativeName,
};
const translationResourceProvider = new TranslationResourceProvider(
  defaultLocaleInfo,
  fallbackLocale,
);

const CustomDashboardServiceSubscriptionProvider: FunctionComponent<React.PropsWithChildren> = ({
  children,
}) => {
  useCustomDashboardServiceSubscription();
  return <>{children}</>;
};

const defaultOpenGraphMetadata = {
  defaultLocale,
  title: defaultMetadataJson['OpenGraph.Title'],
  description: defaultMetadataJson['OpenGraph.Description'],
};

const getDefaultPageLayout: NextGetPageLayout = (page) => page;

const PageEventsTracker: React.FC = () => {
  // Event streams for every page, such as loadPage
  usePageEventsTracker();
  // reports core web vitals (TTFB, FCP, LCP, FID, CLS, INP)
  useReportWebVitals(reportWebVitals);
  return null;
};

const NavigationConfigsWithSettings: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { settings, isFetched } = useSettings();
  return (
    <NavigationConfigsProvider
      currentProduct='CreatorDashboard'
      environment={getNavigationEnvironment()}
      robloxEnvironment={process.env.targetEnvironment}
      target={process.env.buildTarget}
      drawerVariant='belowAppBar'
      signalRCrossTab={{
        enabled: settings.enableSignalRCrossTab,
        isFetched,
      }}
      enableGroupModeration={settings.enableGroupModerationPage}>
      {children}
    </NavigationConfigsProvider>
  );
};

const queryClient = new QueryClient({
  // some sane defaults from toolbox
  defaultOptions: {
    queries: {
      // by default react-query eagerly fetches when you change focus to the browser window
      // this seems to be causing errors and the page shows an error
      // it seems best to just turn this off by default
      refetchOnWindowFocus: false,
      // retry takes too long when there are errors. we should only opt-in for retry.
      retry: false,
    },
  },
});

const authStore = initializeAuthStore();

export const CustomApp: CustomAppFC = ({ Component, pageProps, cache }) => {
  const { query } = useRouter();
  const emotionCache = cache ?? clientSideEmotionCache;
  const getPageLayout = Component.getPageLayout ?? getDefaultPageLayout;
  const openGraphMetadata = useMemo(
    () => ({ ...defaultOpenGraphMetadata, ...Component.pageMetadata }),
    [Component.pageMetadata],
  );

  useMaintenanceObserver(process.env.baseUrl);

  useEffect(() => {
    removeServerSideCSS();
  }, []);
  // NOTE(@yanzhuang, 5/2024): double write legacy events to the new unified logger
  trackerClient.setUnifiedLoggerClient(unifiedLoggerClient);

  return (
    <ErrorBoundary>
      <CacheProvider cache={emotionCache}>
        <MultiProvider
          providers={[
            /* eslint-disable react/jsx-key -- NOTE(jcountryman, 05/06/24): This is manually managed and does
not change */
            <BreadcrumbItemNameProvider />,
            <QueryClientProvider client={queryClient} />, // NOTE: QueryClientProvider must be ordered above anything using react-query
            <CustomDashboardServiceProvider />,
            <UniverseFlaggedCustomDashboardProvider />,
            <CustomDashboardServiceSubscriptionProvider />,
            <UnifiedLoggerProvider pageLoggerConfig={Component.loggerConfig} />,
            <EventTrackerProvider trackerClient={trackerClient} />,
            <AuthenticationProvider
              clientId={process.env.creatorDashboardClientId}
              authenticationClient={authenticationApi}
              discoveryClient={discoveryApi}
              usersClient={usersApi}
              store={authStore}
            />,
            <GroupsProvider />,
            <AuthenticatedThemeModeProvider />,
            <ModeResponsiveThemeProvider
              themeElement={typeof document !== 'undefined' ? document.documentElement : undefined}
            />,
            <LocalizationProvider provider={translationResourceProvider} />,
            <SnackbarProvider />,
            <DialogProvider />,
            <CreatorNotificationsSettingsProvider />,
            <ThumbnailsProvider baseUrl={eventStreamBaseUrl} />,
            <SettingsProvider />,
            <NavigationConfigsWithSettings />,
            <ThemeAwareStudioResourcesProvider />,
            <MetricsMonitoringProvider />,
            <OrganizationProvider />,
            <LeftNavigationStateProvider />,
            <CookieConsentProvider robloxSiteDomain={process.env.robloxSiteDomain} />,
            <AgeVerificationUpsellProvider />,
            /* eslint-enable react/jsx-key -- NOTE(jcountryman, 05/06/24): This is manually managed and does
not change */
          ]}>
          <PageEventsTracker />
          <MonetizationSnackbarOutlet />
          <MonetizationDialogOutlet />
          <ModerationOverlay />
          <UserAgreementCheck />
          <FeatureFlagLocalOverrideWidget />
          <PageHead openGraphMetadata={openGraphMetadata} />
          {getPageLayout(<Component {...pageProps} />, { query })}
        </MultiProvider>
      </CacheProvider>
    </ErrorBoundary>
  );
};

export default CustomApp;
