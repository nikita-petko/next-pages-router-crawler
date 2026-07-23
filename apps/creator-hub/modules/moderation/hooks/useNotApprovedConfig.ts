import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from '@rbx/intl';
import type { NotApprovedAnalyticsEvent } from '@rbx/not-approved-page-events';
import { EventTypes } from '@rbx/not-approved-page-events';
import type { NotApprovedUIConfig, TPunishment } from '@rbx/not-approved-page-ui';
import { useAuthentication } from '@modules/authentication/providers';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { getAuthorizationEndpoint } from '@modules/navigation/applicationAuthorization/services/appAuthDataService';

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

  const surfaceColor = 'var(--color-surface-100)';

  // Wrap translate to convert Record<string, unknown> params to Record<string, string>
  const translateAdapter = useCallback(
    (key: string, params?: Record<string, unknown>): string => {
      if (!params) {
        return translate(key);
      }

      const stringParams = Object.fromEntries(
        Object.entries(params).map(([k, v]) => [k, String(v)]),
      );

      return translate(key, stringParams);
    },
    [translate],
  );

  const httpGet = useCallback(async <T>(url: string): Promise<T> => {
    const response = await fetch(url, { credentials: 'include' });

    if (!response.ok) {
      throw new Error(`HTTP GET ${url} failed with status ${response.status}`);
    }

    // Response.json() is typed as Promise<any> by lib.dom; T is supplied by the caller and
    // represents the contractually-expected response shape, so we widen via typed assignment
    // rather than `as`.
    // oxlint-disable-next-line typescript/no-unsafe-assignment, typescript/no-unsafe-return -- response.json() returns any; T is the caller-asserted shape
    const data: T = await response.json();
    return data;
  }, []);

  const httpPost = useCallback(async <T>(url: string, body?: object): Promise<T> => {
    const makeRequest = async (csrfToken?: string): Promise<Response> => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (csrfToken) {
        headers['x-csrf-token'] = csrfToken;
      }

      return fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    };

    let response = await makeRequest();

    // On 403, check for CSRF token in response header and retry
    if (response.status === 403) {
      const csrfToken = response.headers.get('x-csrf-token');

      if (csrfToken) {
        response = await makeRequest(csrfToken);
      }
    }

    if (!response.ok) {
      throw new Error(`HTTP POST ${url} failed with status ${response.status}`);
    }

    // Response.json() is typed as Promise<any> by lib.dom; T is supplied by the caller and
    // represents the contractually-expected response shape, so we widen via typed assignment
    // rather than `as`.
    // oxlint-disable-next-line typescript/no-unsafe-assignment, typescript/no-unsafe-return -- response.json() returns any; T is the caller-asserted shape
    const data: T = await response.json();
    return data;
  }, []);

  const userModerationApiUrl = `https://usermoderation.${process.env.bedev1BaseDomain}`;
  const apiGatewayUrl = process.env.bedev2BaseUrl;
  const websiteUrl = `https://${process.env.robloxSiteDomain}`;

  const platform = 'CreatorHub';

  const sendAnalyticsEvent = useCallback((event: NotApprovedAnalyticsEvent) => {
    unifiedLoggerClient.logNotApprovedPageEvent(event.properties);
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
      translate: translateAdapter,
      httpGet,
      httpPost,
      userModerationApiUrl,
      apiGatewayUrl,
      websiteUrl,
      sendAnalyticsEvent,
      platform,
      surfaceColor,
      shouldShowGenericFallback,
      onLogout,
      onAccountReactivated,
    }),
    [
      translateAdapter,
      httpGet,
      httpPost,
      userModerationApiUrl,
      apiGatewayUrl,
      websiteUrl,
      sendAnalyticsEvent,
      platform,
      surfaceColor,
      shouldShowGenericFallback,
      onLogout,
      onAccountReactivated,
    ],
  );
}

export default useNotApprovedConfig;
