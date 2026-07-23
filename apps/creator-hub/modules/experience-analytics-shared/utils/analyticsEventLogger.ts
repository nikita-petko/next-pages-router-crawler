import { UnifiedLogger } from '@rbx/unified-logger';

export const toUTCCalendarDay = (date: Date): string => {
  const offsetMillis = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMillis).toISOString().substring(0, 10);
};

const toSnakeCase = (str: string): string => {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

export const transformParameters = <T extends Record<string, string | number | boolean | Date>>(
  params: T,
): Record<string, string> => {
  return Object.entries(params).reduce(
    (acc, [key, value]) => {
      acc[toSnakeCase(key)] = value instanceof Date ? toUTCCalendarDay(value) : String(value);
      return acc;
    },
    {} as Record<string, string>,
  );
};

export const logAnalyticsImpressionEvent = <
  T extends Record<string, string | number | boolean | Date>,
>(
  client: UnifiedLogger,
  eventName: string,
  params: T,
) => {
  const transformedParams = transformParameters(params);
  client.logImpressionEvent({ eventName, parameters: transformedParams });
};

export const logAnalyticsClickEvent = <T extends Record<string, string | number | boolean | Date>>(
  client: UnifiedLogger,
  eventName: string,
  params: T,
) => {
  const transformedParams = transformParameters(params);
  client.logClickEvent({ eventName, parameters: transformedParams });
};
