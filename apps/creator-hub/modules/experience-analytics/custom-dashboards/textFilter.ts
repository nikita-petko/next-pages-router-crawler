import type { TextFilterFn } from '@modules/experience-analytics-shared/text-filter/TextFilterContext';
import { createDefaultCustomDashboardsApiClient } from './service/customDashboardsApiClient';

const customDashboardsApiClient = createDefaultCustomDashboardsApiClient();

export const filterCustomDashboardText =
  (universeId: number): TextFilterFn =>
  async (text, format = 'title') => {
    const response = await customDashboardsApiClient.filterDashboardText({
      universeId,
      text,
      format,
    });
    return { isFiltered: response.isFiltered };
  };
