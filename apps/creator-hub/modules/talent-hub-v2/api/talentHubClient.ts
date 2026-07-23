import { Configuration } from '@rbx/clients';
import { JobsApi, StudiosApi } from '@rbx/clients/talentHubV2Service/v1';
import { getBEDEV2ServiceBasePath } from '@modules/clients/utils';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';

const configuration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath: getBEDEV2ServiceBasePath('talent-hub-v2-service'),
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});

export const jobsApi = new JobsApi(configuration);
export const studiosApi = new StudiosApi(configuration);
