import { UnifiedLogger } from '@rbx/unified-logger';

export const getEventStreamBaseUrl = (robloxSiteDomain: string) =>
  `https://ecsv2.${robloxSiteDomain}`;

export function createSearchEventLogger(robloxSiteDomain: string): UnifiedLogger {
  return new UnifiedLogger({
    eventBaseUrl: getEventStreamBaseUrl(robloxSiteDomain),
    product: 'CreatorDashboard',
    sessionProductGroup: 'CreatorHub',
  });
}
