import { AccessManagementAPIApi } from '@rbx/client-access-management-api/v1';
import { Configuration } from '@rbx/clients-core';

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
  enableMrRouter: true,
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
      enableMrRouter: true,
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
    throw new TypeError('featureCheckAsync can only be called on the client side');
  }

  const accessManagementClient = getAccessManagementClient(apiGatewayBaseUrl);

  try {
    const apiResponse = await accessManagementClient.accessManagementAPIGetUpsellFeatureAccessRaw({
      featureName,
      namespace,
    });

    // oxlint-disable-next-line typescript/no-unsafe-assignment -- Response.json() returns unknown at runtime; narrowed by the assertion below.
    const responseBody = await apiResponse.raw.json();
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- FeatureCheckResponse is the expected API contract.
    return responseBody as FeatureCheckResponse;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to check feature access: ${errorMessage}`, { cause: error });
  }
};
