import { Configuration } from '@rbx/clients';
import { GameServersApi, RestartsApi } from '@rbx/clients/serverManagementService';
import { getBEDEV2ServiceBasePath } from '@modules/clients/utils';

const basePath = getBEDEV2ServiceBasePath('server-management');
const config = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
});

export const serverManagementApi = new GameServersApi(config);
export const restartsApi = new RestartsApi(config);
