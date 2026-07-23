import { UserSettingsApiApi } from '@rbx/client-user-settings-api/v1';
import { Configuration } from '@rbx/clients-core';

export interface UserSettingsResponse {
  allowSellShareData?: string;
  [key: string]: unknown;
}

// Cache clients by basePath to avoid creating new clients per request
const userSettingsClientCache = new Map<string, UserSettingsApiApi>();

const getUserSettingsClient = (userSettingsApiBaseUrl: string): UserSettingsApiApi => {
  let client = userSettingsClientCache.get(userSettingsApiBaseUrl);
  if (!client) {
    const configuration = new Configuration({
      basePath: userSettingsApiBaseUrl,
      credentials: 'include',
      enableMrRouter: true,
    });
    client = new UserSettingsApiApi(configuration);
    userSettingsClientCache.set(userSettingsApiBaseUrl, client);
  }

  return client;
};

export const setGlobalPrivacyControlAsync = async (
  userSettingsApiBaseUrl: string,
): Promise<void> => {
  const userSettingsClient = getUserSettingsClient(userSettingsApiBaseUrl);

  try {
    await userSettingsClient.userSettingsApiSetGlobalPrivacyControl();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to set Global Privacy Control: ${errorMessage}`, { cause: error });
  }
};

export const getUserSettingsAsync = async <T extends UserSettingsResponse = UserSettingsResponse>(
  userSettingsApiBaseUrl: string,
): Promise<T> => {
  const userSettingsClient = getUserSettingsClient(userSettingsApiBaseUrl);

  try {
    // oxlint-disable-next-line typescript/no-unsafe-assignment -- SDK method returns an untyped response; narrowed by the assertion below.
    const response = await userSettingsClient.userSettingsApiGet({
      requestedUserSettings: 'allowSellShareData',
    });
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- UserSettingsResponse is the expected API contract.
    return response as T;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to get user settings: ${errorMessage}`, { cause: error });
  }
};
