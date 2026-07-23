import { getBEDEV2ServiceBasePath } from '@modules/clients/utils';
import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { ServiceEfficiencyApiApi } from '@rbx/clients/serviceEfficiencyApi';

const defaultConfig = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath: getBEDEV2ServiceBasePath('service-efficiency-api'),
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});

export type { ServiceEfficiencyApiApi as ServiceEfficiencyClient } from '@rbx/clients/serviceEfficiencyApi';
const serviceEfficiencyClient = new ServiceEfficiencyApiApi(defaultConfig);
export default serviceEfficiencyClient;
