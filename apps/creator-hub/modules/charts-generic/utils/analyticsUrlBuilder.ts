import type { AnalyticsNavigationItem } from '../constants/analyticsNavigationItems';
import type AnalyticsQueryParams from '../enums/AnalyticsQueryParams';

export type AnalyticsSearchParams = { [key in AnalyticsQueryParams]?: string | Array<string> };

function buildQueryString(analyticsSearchParams: AnalyticsSearchParams): string {
  const urlSearchParams = new URLSearchParams();

  Object.entries(analyticsSearchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((element) => {
        urlSearchParams.append(key, element);
      });
    } else if (value !== undefined && value !== null) {
      // URLSearchParams.append coerces undefined/null to the literal strings
      // "undefined"/"null" — drop them so callers don't have to scrub.
      urlSearchParams.append(key, value);
    }
  });

  return urlSearchParams.toString();
}

function buildExperienceAnalyticsUrlWithParams(
  navigationItem: AnalyticsNavigationItem,
  analyticsSearchParams: AnalyticsSearchParams,
  universeId: number,
) {
  const basePath = `/dashboard/creations/experiences/${universeId}${navigationItem.path}`;
  return Object.keys(analyticsSearchParams).length === 0
    ? basePath
    : `${basePath}?${buildQueryString(analyticsSearchParams)}`;
}
export default buildExperienceAnalyticsUrlWithParams;
