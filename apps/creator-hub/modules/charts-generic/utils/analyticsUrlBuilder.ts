import type { AnalyticsNavigationItem } from '../constants/analyticsNavigationItems';
import AnalyticsQueryParams from '../enums/AnalyticsQueryParams';

export type AnalyticsSearchParams = { [key in AnalyticsQueryParams]?: string | Array<string> };

function buildQueryString(analyticsSearchParams: AnalyticsSearchParams): string {
  const urlSearchParams = new URLSearchParams();

  Object.entries(analyticsSearchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((element) => {
        urlSearchParams.append(key, element);
      });
    } else {
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
