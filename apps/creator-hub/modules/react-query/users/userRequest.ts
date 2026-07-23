import { Configuration } from '@rbx/clients';
import { getBEDEV1ServiceBasePath } from '@modules/clients/utils';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { UsersApi } from '@rbx/clients/users/v1';

const configuration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath: getBEDEV1ServiceBasePath('users'),
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});

const userAPI = new UsersApi(configuration);

const getUserById = (userId: number) => {
  return userAPI.v1UsersUserIdGet({ userId });
};

export default getUserById;
