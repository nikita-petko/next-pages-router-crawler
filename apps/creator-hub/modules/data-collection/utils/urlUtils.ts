import { getAuthorizationEndpoint } from '@modules/navigation/applicationAuthorization/services/appAuthDataService';
import DataSharingQueryParams from '../enums/DataSharingQueryParams';
import DataSharingTabKey from '../enums/DataSharingTabKey';

export const getLoginUrl = async (redirectPath: string) => {
  const redirectUri = `${process.env.baseUrl}${redirectPath}`;

  return getAuthorizationEndpoint({ redirectUri });
};

export const publicLuauTabQuery = new URLSearchParams({
  [DataSharingQueryParams.Tab]: DataSharingTabKey.LuauDataset,
}).toString();

export const publicLuauTabUrl = `/settings/data-collection?${publicLuauTabQuery}`;
