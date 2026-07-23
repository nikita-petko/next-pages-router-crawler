/* eslint-disable import/prefer-default-export */
import { SearchApi } from '@rbx/client-universes-api/v1';
import { Configuration } from '@rbx/clients-core';

import { GetBEDEV2ServiceBasePath, GetSitetestBaseUrl } from '@utils/url';

const basePath = GetBEDEV2ServiceBasePath('universes');

const configuration = new Configuration({
  basePath,
  credentials: 'include',
  robloxSiteDomain: GetSitetestBaseUrl(),
});

export const universesSearchClient = new SearchApi(configuration);
