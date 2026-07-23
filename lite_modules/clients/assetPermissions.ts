/* eslint-disable import/prefer-default-export */
import { AssetPermissionsApi } from '@rbx/client-asset-permissions-api/v1';
import { Configuration } from '@rbx/clients-core';

import { GetBEDEV2ServiceBasePath, GetSitetestBaseUrl } from '@utils/url';

const configuration = new Configuration({
  basePath: GetBEDEV2ServiceBasePath('asset-permissions-api'),
  credentials: 'include',
  robloxSiteDomain: GetSitetestBaseUrl(),
});

export const assetPermissionsClient = new AssetPermissionsApi(configuration);
