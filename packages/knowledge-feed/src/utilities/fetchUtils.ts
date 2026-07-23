import { Configuration } from '@rbx/clients-core';
import { DocSiteFeedApi } from '@rbx/client-doc-site-feeds-api/v1';
import type { DocSiteFeedGetFeedsRequest } from '@rbx/client-doc-site-feeds-api/v1';
import type { TFeedItemData } from '../types';

// * NOTE(@zwang, 02/19/25): this isn't accounting for Luobu use case, can be a follow-up
function getBEDEV2ServiceBasePath(robloxSiteDomain: string, serviceName: string) {
  if (
    ![
      'roblox.com',
      'sitetest1.robloxlabs.com',
      'sitetest2.robloxlabs.com',
      'sitetest3.robloxlabs.com',
    ].includes(robloxSiteDomain)
  ) {
    throw Error(
      `getBEDEV1ServiceBasePath received an invalid robloxSiteDomain: ${robloxSiteDomain}`,
    );
  }
  return `https://apis.${robloxSiteDomain}/${serviceName}`;
}

const DOC_SITE_FEED_API_SERVICE_NAME = 'doc-site';
export default function createFetcher(robloxSiteDomain: string) {
  const configuration = new Configuration({
    basePath: getBEDEV2ServiceBasePath(robloxSiteDomain, DOC_SITE_FEED_API_SERVICE_NAME),
    credentials: 'include',
  });
  const docSiteFeedAPI = new DocSiteFeedApi(configuration);

  return {
    async fetchFeedItems(surfaceType: string, feedTypes?: string[]): Promise<TFeedItemData[]> {
      const requestParams: DocSiteFeedGetFeedsRequest = {
        surfaceType,
      };

      if (feedTypes && feedTypes.length > 0) {
        requestParams.feedTypes = feedTypes.join(',');
      }
      const { feedItems } = await docSiteFeedAPI.docSiteFeedGetFeeds(requestParams);

      // TODO(@zwang, 02/20/25): remove or update after BE swagger tweaks
      return (feedItems ?? []) as TFeedItemData[];
    },
  };
}
