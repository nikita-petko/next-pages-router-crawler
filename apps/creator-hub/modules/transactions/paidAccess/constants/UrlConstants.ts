const basePath = `https://www.${process.env.robloxSiteDomain}`;
const creatorStoreBaseUrl = `${process.env.baseUrl}`;

export const getUserUrl = (userId: number) => `${basePath}/users/${userId}/profile`;
export const getPlaceUrl = (universeId: number) =>
  `${creatorStoreBaseUrl}/dashboard/creations/experiences/${universeId}/overview`;
