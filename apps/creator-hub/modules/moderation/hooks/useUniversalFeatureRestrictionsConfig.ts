import { useCallback, useMemo } from 'react';
import { useLocalization, useTranslation } from '@rbx/intl';
import {
  createUniversalFeatureRestrictionsApi,
  type TranslateHtmlFn,
  type UniversalFeatureRestrictionsAnalyticsEvent,
  type UniversalFeatureRestrictionsConfig,
} from '@rbx/universal-feature-restrictions';
import { useAuthentication } from '@modules/authentication/providers';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  authenticatedHttpGet,
  authenticatedHttpPostWithoutResponse,
} from '../services/authenticatedHttp';

const PLACEMENT = 'CreatorHub';

const api = createUniversalFeatureRestrictionsApi({
  httpGet: authenticatedHttpGet,
  httpPost: authenticatedHttpPostWithoutResponse,
  userModerationApiUrl: `https://usermoderation.${process.env.bedev1BaseDomain}`,
});

const useUniversalFeatureRestrictionsConfig = (): UniversalFeatureRestrictionsConfig => {
  const { translate, translateHTML, ready } = useTranslation();
  const { locale } = useLocalization();
  const { user } = useAuthentication();

  const sendAnalyticsEvent = useCallback(
    (event: UniversalFeatureRestrictionsAnalyticsEvent): void => {
      unifiedLoggerClient.logHostRoutedEvent({
        eventType: event.name,
        context: event.context,
        properties: { ...event.properties },
        hostProperties: { user_id: user?.id ?? 0 },
      });
    },
    [user?.id],
  );

  const translateHtmlAdapter = useCallback<TranslateHtmlFn>(
    (key, tags, args) =>
      translateHTML(
        key,
        tags?.map(({ opening, closing, render }) => ({
          opening,
          closing,
          content: render,
        })),
        args,
      ),
    [translateHTML],
  );

  return useMemo(
    () => ({
      translate,
      translateHtml: translateHtmlAdapter,
      translationsReady: ready,
      api,
      sendAnalyticsEvent,
      websiteUrl: `https://${process.env.robloxSiteDomain}`,
      placement: PLACEMENT,
      locale: locale ?? undefined,
    }),
    [locale, ready, sendAnalyticsEvent, translate, translateHtmlAdapter],
  );
};

export default useUniversalFeatureRestrictionsConfig;
