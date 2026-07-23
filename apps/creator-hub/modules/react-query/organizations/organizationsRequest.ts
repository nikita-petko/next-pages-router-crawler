import { Configuration } from '@rbx/clients';
import { UniversesApi } from '@rbx/clients/organizationsServiceApi';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { getBEDEV2ServiceBasePath } from '@modules/clients/utils';
import { organizationApiClient } from '@modules/clients';

const basePath = getBEDEV2ServiceBasePath('orgs');
const configuration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});
const universeApi = new UniversesApi(configuration);

const getUniversePermissions = (universeId: string | number) => {
  return universeApi.v2UniversesUniverseIdPermissionsResolvedGet({
    universeId: String(universeId),
  });
};

const getOrganization = (groupId: number | null) => {
  return organizationApiClient.organizationClient.getOrganization(groupId?.toString() ?? '0');
};

const getUserPermissions = (organizationId: string | null, userId: number | undefined) => {
  if (!organizationId || !userId) {
    return undefined;
  }

  return organizationApiClient.userClient.getUserPermissions(
    organizationId?.toString(),
    userId.toString(),
  );
};

export { getUniversePermissions, getOrganization, getUserPermissions };
