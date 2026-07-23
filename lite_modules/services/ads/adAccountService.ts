import adsClient from '@clients/ads';
import authClient from '@clients/auth';
import userModerationClient from '@clients/userModeration';
import usersClient from '@clients/users';
import {
  CreateAdAccountRequest,
  CurrentUserResponse,
  GetValidateDisplayNameResult,
  UpdateAdvertiserRequest,
} from '@type/advertiser';
import { GetSitetestBaseUrl } from '@utils/url';

export const createAdAccount = async (
  body: CreateAdAccountRequest,
  options?: { groupId?: number },
) => {
  const url =
    options?.groupId !== undefined ? `/v1/advertiser?groupId=${options.groupId}` : '/v1/advertiser';
  const response = await adsClient.post<CreateAdAccountRequest>({
    body,
    url,
  });
  return response.data;
};

export const updateAdvertiserAccount = async (body: Partial<UpdateAdvertiserRequest>) => {
  const response = await adsClient.patch<CreateAdAccountRequest>({
    body,
    url: '/v1/advertiser',
  });
  return response.data;
};

interface getAdAccountModerationStatusResponse {
  restriction: boolean;
}

export const getAdAccountModerationStatus = async () => {
  const response = await userModerationClient.get<getAdAccountModerationStatusResponse>({
    url: '/not-approved',
  });
  return response.data;
};

export const logout = async () => {
  const response = await authClient.post<boolean>({
    body: {},
    url: `https://auth.${GetSitetestBaseUrl()}/v2/logout`,
  });
  return response.data;
};

export const setImpCookie = async (adAccountImp: string, configOverrides?: string) => {
  const params = new URLSearchParams({ ad_account_imp: adAccountImp });
  if (configOverrides) {
    params.append('config_overrides', configOverrides);
  }

  const url = `/v1/setImpCookie?${params.toString()}`;
  const response = await adsClient.post({
    body: {
      ad_account_imp: adAccountImp,
    },
    url,
  });
  return response.data;
};

export const getValidateDisplayName = async (
  name: string,
): Promise<GetValidateDisplayNameResult> => {
  const response = await adsClient.get<GetValidateDisplayNameResult>({
    url: `/v1/displayName/validate?name=${encodeURIComponent(name)}`,
  });
  return response.data;
};

export const getCurrentUser = async (): Promise<CurrentUserResponse> => {
  const response = await usersClient.get<CurrentUserResponse>({ url: '/users/authenticated' });
  return response.data;
};

export interface UserBirthdateResponse {
  birthDay: number;
  birthMonth: number;
  birthYear: number;
}

export const getUserBirthdate = async () => {
  const response = await usersClient.get<UserBirthdateResponse>({ url: '/birthdate' });
  return response.data;
};
