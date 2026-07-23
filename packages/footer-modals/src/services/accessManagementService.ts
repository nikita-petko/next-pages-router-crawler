import { Configuration } from '@rbx/clients-core';
import { AccessManagementAPIApi } from '@rbx/client-access-management-api/v1';

export interface FeatureCheckResponse {
  access: string;
  [key: string]: unknown;
}

function getBEDEV2ServiceBasePath(serviceName: string) {
  return `${process.env.bedev2BaseUrl}/${serviceName}`;
}

const basePath = getBEDEV2ServiceBasePath('access-management');

const configuration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
});

const accessManagementService = new AccessManagementAPIApi(configuration);
export default accessManagementService;

// Cache clients by basePath to avoid creating new clients per request
const accessManagementClientCache = new Map<string, AccessManagementAPIApi>();

const getAccessManagementClient = (apiGatewayBaseUrl: string): AccessManagementAPIApi => {
  const serviceBasePath = `${apiGatewayBaseUrl}/access-management`;

  let client = accessManagementClientCache.get(serviceBasePath);
  if (!client) {
    const clientConfiguration = new Configuration({
      basePath: serviceBasePath,
      credentials: 'include',
    });
    client = new AccessManagementAPIApi(clientConfiguration);
    accessManagementClientCache.set(serviceBasePath, client);
  }

  return client;
};

export const featureCheckAsync = async (
  apiGatewayBaseUrl: string,
  featureName: string,
  namespace: string,
): Promise<FeatureCheckResponse> => {
  if (typeof window === 'undefined') {
    throw new Error('featureCheckAsync can only be called on the client side');
  }

  const accessManagementClient = getAccessManagementClient(apiGatewayBaseUrl);

  try {
    const apiResponse = await accessManagementClient.accessManagementAPIGetUpsellFeatureAccessRaw({
      featureName,
      namespace,
    });

    const responseBody = await apiResponse.raw.json();
    return responseBody as FeatureCheckResponse;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to check feature access: ${errorMessage}`);
  }
};
