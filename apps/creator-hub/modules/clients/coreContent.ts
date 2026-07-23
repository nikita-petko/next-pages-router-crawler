import { getBEDEV2ServiceBasePath } from '@modules/clients/utils';
import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { CoreContentApi } from '@rbx/clients/coreContentApi';

const defaultConfig = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath: getBEDEV2ServiceBasePath('core-content'),
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});

export type { CoreContentApi as CoreContentClient } from '@rbx/clients/coreContentApi';
const coreContentClient = new CoreContentApi(defaultConfig);
export default coreContentClient;
