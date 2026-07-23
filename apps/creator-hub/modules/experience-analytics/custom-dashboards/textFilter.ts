import gameUpdateNotificationsClient from '@modules/clients/gameUpdateNotifications';
import type { TextFilterFn } from '@modules/experience-analytics-shared/text-filter/TextFilterContext';

export const filterCustomDashboardText: TextFilterFn = async (text) => {
  const response = await gameUpdateNotificationsClient.filterGameUpdateText({ body: text });
  return { isFiltered: response.isFiltered === true };
};
