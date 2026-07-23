/* eslint-disable import/prefer-default-export */
import { EmailApi } from '@rbx/client-accountsettings/v1';
import { Configuration } from '@rbx/clients-core';

import { GetBEDEV1ServiceBasePath, GetSitetestBaseUrl } from '@utils/url';

const basePath = GetBEDEV1ServiceBasePath('accountSettings');

const configuration = new Configuration({
  basePath,
  credentials: 'include',
  robloxSiteDomain: GetSitetestBaseUrl(),
});

export const emailClient = new EmailApi(configuration);
