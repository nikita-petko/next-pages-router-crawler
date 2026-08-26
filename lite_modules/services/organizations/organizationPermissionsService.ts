import organizationsClient from '@clients/organizations';
import { getCurrentUser } from '@services/ads/adAccountService';

interface OrganizationResponse {
  id?: string;
}

interface OrganizationPermissionsResponse {
  canConfigureRevenueDetails?: boolean;
}

export const getCanConfigureRevenueDetails = async (
  groupId: number,
  abortSignal?: AbortSignal,
): Promise<boolean> => {
  const [organizationResponse, currentUser] = await Promise.all([
    organizationsClient.get<OrganizationResponse>({
      abortSignal,
      url: `organizations?groupId=${groupId}`,
    }),
    getCurrentUser(abortSignal),
  ]);

  const organizationId = organizationResponse.data.id;
  if (!organizationId) {
    return false;
  }

  const permissionsResponse = await organizationsClient.get<OrganizationPermissionsResponse>({
    abortSignal,
    url: `organizations/${organizationId}/users/${currentUser.id}/permissions`,
  });

  return permissionsResponse.data.canConfigureRevenueDetails === true;
};
