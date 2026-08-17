import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from '@rbx/intl';
import {
  EventTypes,
  type NotApprovedAnalyticsEvent,
  type NotApprovedUIConfig,
  type TPunishment,
} from '@rbx/not-approved-page-ui';
import { useAuthentication } from '@modules/authentication/providers';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { getAuthorizationEndpoint } from '@modules/navigation/applicationAuthorization/services/appAuthDataService';
import {
  authenticatedHttpGet as httpGet,
  authenticatedHttpPost as httpPost,
} from '../services/authenticatedHttp';

/**
 * Builds the complete NotApprovedUIConfig object for the NotApprovedUIProvider.
 * This hook wires up translate, HTTP clients, analytics, environment URLs,
 * logout/reactivation callbacks, and the package-owned generic fallback dialog
 * (opted into via `shouldShowGenericFallback`).
 */
function useNotApprovedConfig(): NotApprovedUIConfig {
  const { translate } = useTranslation();
  const auth = useAuthentication();
  const router = useRouter();

  const userModerationApiUrl = `https://usermoderation.${process.env.bedev1BaseDomain}`;
  const apiGatewayUrl = process.env.bedev2BaseUrl;
  const websiteUrl = `https://${process.env.robloxSiteDomain}`;

  const platform = 'CreatorHub';

  const sendAnalyticsEvent = useCallback((event: NotApprovedAnalyticsEvent) => {
    unifiedLoggerClient.logHostRoutedEvent({
      eventType: event.eventName,
      context: event.context,
      properties: event.properties,
    });
  }, []);

  const shouldShowGenericFallback = useCallback(
    (punishmentData: TPunishment) =>
      punishmentData.verificationCategory ? EventTypes.VerificationRedirectRendered : false,
    [],
  );

  const onLogout = useCallback(async (): Promise<void> => {
    const loginUrl = await getAuthorizationEndpoint({
      redirectUri: process.env.baseUrl,
    });
    await auth.logout();
    await router.push(loginUrl);
  }, [router, auth]);

  const onAccountReactivated = useCallback((): void => {
    router.reload();
  }, [router]);

  return useMemo(
    (): NotApprovedUIConfig => ({
      translate,
      httpGet,
      httpPost,
      userModerationApiUrl,
      apiGatewayUrl,
      websiteUrl,
      sendAnalyticsEvent,
      platform,
      shouldShowGenericFallback,
      onLogout,
      onAccountReactivated,
    }),
    [
      translate,
      userModerationApiUrl,
      apiGatewayUrl,
      websiteUrl,
      sendAnalyticsEvent,
      platform,
      shouldShowGenericFallback,
      onLogout,
      onAccountReactivated,
    ],
  );
}

export default useNotApprovedConfig;
