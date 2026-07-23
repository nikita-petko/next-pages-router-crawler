/**
 * Utility functions for building base paths from robloxSiteDomain.
 *
 * These functions take the domain directly (e.g., 'roblox.com', 'sitetest1.robloxlabs.com')
 * rather than computing it from target/environment. The consuming app
 * (e.g., creator-hub-navigation) is responsible for providing the correct domain.
 */

export const robloxSiteDomainDevelopment = 'sitetest3.robloxlabs.com';

/**
 * Gets the Creator Hub base URL.
 *
 * @param robloxSiteDomain - The Roblox site domain (e.g., 'roblox.com')
 * @returns The Creator Hub base URL (e.g., 'https://create.roblox.com')
 */
export function getCreatorHubBaseUrl(robloxSiteDomain: string): string {
  return `https://create.${robloxSiteDomain}`;
}

/**
 * Gets the Creator Hub docs base URL.
 *
 * @param robloxSiteDomain - The Roblox site domain (e.g., 'roblox.com')
 * @returns The Creator Hub docs base URL (e.g., 'https://create.roblox.com/docs')
 */
export function getCreatorHubDocsBaseUrl(robloxSiteDomain: string): string {
  return `${getCreatorHubBaseUrl(robloxSiteDomain)}/docs`;
}

/**
 * Gets the BEDEV2 API base path (apis.roblox.com style).
 *
 * @param robloxSiteDomain - The Roblox site domain (e.g., 'roblox.com')
 * @returns The BEDEV2 API base URL (e.g., 'https://apis.roblox.com')
 */
export function getBedev2BasePath(robloxSiteDomain: string): string {
  // Handle luobu production specially
  if (robloxSiteDomain === 'roblox.qq.com') {
    return 'https://apis.api.robloxdev.cn';
  }
  return `https://apis.${robloxSiteDomain}`;
}

/**
 * Gets the BEDEV2 service base path for a given service.
 *
 * @param serviceName - The name of the service (e.g., 'creator-resources-search-api')
 * @param robloxSiteDomain - The Roblox site domain
 * @returns The full base path URL for the service
 */
export function getBEDEV2ServiceBasePath(serviceName: string, robloxSiteDomain: string): string {
  return `${getBedev2BasePath(robloxSiteDomain)}/${serviceName}`;
}
