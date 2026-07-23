import 'promise-polyfill/src/polyfill';
import '@formatjs/intl-relativetimeformat/polyfill';
import '@rbx/webfont';
import '../styles/globals.css';
import React, { useEffect } from 'react';
import type { NextComponentType, NextGetPageLayout } from 'next';
import type { AppContext, AppInitialProps, AppLayoutProps } from 'next/app';
import { useRouter } from 'next/router';
import { useReportWebVitals } from 'next/web-vitals';
import { initializeAuthStore } from '@rbx/auth';
import { LocalizationProvider } from '@rbx/intl';
import { AuthClient, UsersClient, ApplicationAuthorizationsClient } from '@modules/clients';
import { AuthenticationProvider } from '@modules/authentication/providers';
import { SettingsProvider, useSettings } from '@modules/settings';
import { useMaintenanceObserver } from '@rbx/creator-hub-error';
import { PageHead } from '@modules/miscellaneous/pageMetadata';
import {
  TranslationResourceProvider,
  defaultLocale,
  defaultNativeName,
  fallbackLocale,
  defaultMetadataJson,
} from '@modules/miscellaneous/localization';
import { MetricsMonitoringProvider } from '@modules/miscellaneous/metricsMonitoring';
import UserAgreementCheck from '@modules/user-agreements/components/UserAgreementCheck';
import {
  ThemeAwareStudioResourcesProvider,
  usePageEventsTracker,
} from '@modules/miscellaneous/hooks';
import {
  CacheProvider,
  createCache,
  SnackbarProvider,
  DialogProvider,
  removeServerSideCSS,
} from '@rbx/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { createThumbnailsClient, ThumbnailsProvider } from '@rbx/thumbnails';
import { getBEDEV1ServiceBasePath } from '@modules/clients/utils';
import { NavigationConfigsProvider } from '@rbx/creator-hub-navigation';
import ModerationWrapper from '@modules/navigation/layout/components/ModerationWrapper';
import getNavigationEnvironment from '@modules/navigation/utils/getNavigationEnvironment';
import { LeftNavigationStateProvider } from '@modules/navigation/layout/hooks/LeftNavigationStateContext';
import { ErrorBoundary } from '@sentry/nextjs';
import MarketplacePublishingRequirementsProvider from '@modules/marketplacePublishingRequirements/MarketplacePublishingRequirementsProvider';
import { EventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
// eslint-disable-next-line no-restricted-imports -- (agrim 2023-04-10) App level import needs trackerClient
import trackerClient, { eventStreamBaseUrl } from '@modules/eventStream/tracker';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import MultiProvider from '@modules/miscellaneous/common/components/MultiProvider';
import { UnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import CreatorNotificationsSettingsProvider from '@modules/creator-settings/hooks/CreatorNotificationsSettingsContext';
import ModeResponsiveThemeProvider from '@modules/creator-settings/hooks/ModeResponsiveThemeProvider';
import AuthenticatedThemeModeProvider from '@modules/creator-settings/hooks/AuthenticatedThemeModeProvider';
import { createWebVitalsReporter } from '@rbx/web-vitals';
import OrganizationProvider from '@modules/group/providers/OrganizationProvider';
import { GroupsProvider } from '@modules/providers/groups/GroupsProvider';
import { CookieConsentProvider } from '@rbx/cookie-banner';
import { DialogOutlet as MonetizationDialogOutlet } from '@modules/monetization-shared/dialog/outlet';
import { SnackbarOutlet as MonetizationSnackbarOutlet } from '@modules/monetization-shared/snackbar/outlet';
import { AgeVerificationUpsellProvider } from '@modules/age-verification-upsell/context/AgeVerificationUpsellContext';
import FeatureFlagsOverrideWidget from '@modules/feature-flags/floating-widget/FloatingDraggableWidget';

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

const defaultLocaleInfo = { locale: defaultLocale, nativeName: defaultNativeName };
const translationResourceProvider = new TranslationResourceProvider(
  defaultLocaleInfo,
  fallbackLocale,
);

const openGraphMetadata = {
  defaultLocale,
  title: defaultMetadataJson['OpenGraph.Title'],
  description: defaultMetadataJson['OpenGraph.Description'],
};

const getDefaultPageLayout: NextGetPageLayout = (page) => page;

const PageEventsTracker: React.FC = () => {
  // Event streams for every page, such as loadPage
  usePageEventsTracker();
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

export const CustomApp: CustomAppFC = ({
  Component,
  pageProps,
  cache = clientSideEmotionCache,
}) => {
  const { query } = useRouter();
  const getPageLayout = Component.getPageLayout || getDefaultPageLayout;
  useMaintenanceObserver(process.env.baseUrl);

  // reports core web vitals (TTFB, FCP, LCP, FID, CLS, INP)
  useReportWebVitals(createWebVitalsReporter(unifiedLoggerClient));
  useEffect(() => {
    removeServerSideCSS();
  }, []);
  // NOTE(@yanzhuang, 5/2024): double write legacy events to the new unified logger
  trackerClient.setUnifiedLoggerClient(unifiedLoggerClient);

  return (
    <ErrorBoundary>
      <CacheProvider cache={cache}>
        <MultiProvider
          providers={[
            /* eslint-disable react/jsx-key -- NOTE(jcountryman, 05/06/24): This is manually managed and does
not change */
            <QueryClientProvider client={queryClient} />, // NOTE: QueryClientProvider must be ordered above anything using react-query
            <EventTrackerProvider trackerClient={trackerClient} />,
            <UnifiedLoggerProvider />,
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
            <MarketplacePublishingRequirementsProvider />,
            <OrganizationProvider />,
            <LeftNavigationStateProvider />,
            <CookieConsentProvider robloxSiteDomain={process.env.robloxSiteDomain} />,
            <ModerationWrapper />,
            <AgeVerificationUpsellProvider />,
            /* eslint-enable react/jsx-key -- NOTE(jcountryman, 05/06/24): This is manually managed and does
not change */
          ]}>
          <PageEventsTracker />
          <MonetizationSnackbarOutlet />
          <MonetizationDialogOutlet />

          <PageHead openGraphMetadata={openGraphMetadata} />
          <UserAgreementCheck />
          {getPageLayout(<Component {...pageProps} />, { query })}
          <FeatureFlagsOverrideWidget />
        </MultiProvider>
      </CacheProvider>
    </ErrorBoundary>
  );
};

export default CustomApp;
