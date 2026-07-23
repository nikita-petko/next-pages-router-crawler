import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { EmailApi } from '@rbx/clients/accountsettings/v1';
import { getBEDEV1ServiceBasePath } from './utils';

const basePath = getBEDEV1ServiceBasePath('accountsettings');

const configuration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});

const emailApi = new EmailApi(configuration);

// eslint-disable-next-line import/prefer-default-export -- single named export for consistency with other client modules
export const AccountSettingsClient = { emailApi };
