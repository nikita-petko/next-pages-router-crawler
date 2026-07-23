import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { UnifiedLogger } from '@rbx/unified-logger';

enum AnalyticsKnownErrorEventName {
  UnknownCountryCode = 'analytics/errors/unknownCountryCode',
  UnknownLocaleCode = 'analytics/errors/unknownLocaleCode',
  CountryMapRetrievalFailure = 'analytics/errors/countryMapRetrievalFailure',
}

// NOTE(gperkins@20240614): DSA-2507, maybe convert locale to a dynamic raqi dimension
export const logUnknownLocaleCode = (
  { localeCode, numLocalesLoaded }: { localeCode: string; numLocalesLoaded: number },
  client: UnifiedLogger = unifiedLoggerClient,
) => {
  const eventName = AnalyticsKnownErrorEventName.UnknownLocaleCode;
  client.logErrorEvent({
    eventName,
    parameters: {
      locale_code: localeCode,
      num_locales_loaded: `${numLocalesLoaded}`,
    },
  });
};

// NOTE(gperkins@20240614): investigating DSA-2540, maybe we just remove this logging?
export const logUnknownCountryCode = (
  { countryCode, numCountryCodesLoaded }: { countryCode: string; numCountryCodesLoaded: number },
  client: UnifiedLogger = unifiedLoggerClient,
) => {
  const eventName = AnalyticsKnownErrorEventName.UnknownCountryCode;
  client.logErrorEvent({
    eventName,
    parameters: {
      country_code: countryCode,
      num_country_codes_loaded: `${numCountryCodesLoaded}`,
    },
  });
};

// NOTE(gperkins@20240614): DSA-2540, maybe we just remove this logging?
export const logCountryMapRetrievalFailure = (
  { locale }: { locale: string },
  client: UnifiedLogger = unifiedLoggerClient,
) => {
  const eventName = AnalyticsKnownErrorEventName.CountryMapRetrievalFailure;
  client.logErrorEvent({
    eventName,
    parameters: {
      locale_code: locale,
    },
  });
};
