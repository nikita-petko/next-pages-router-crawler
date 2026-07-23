import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  AnalyticsWatchlistsAPIApi,
  V1WatchlistsWatchlistTypeGetRequest,
  Watchlist,
  V1WatchlistsWatchlistTypePostRequest,
} from '@rbx/clients/analyticsWatchlists/v1';
import { getBEDEV2ServiceBasePath } from '../utils';

const watchlistsApi = new AnalyticsWatchlistsAPIApi(
  new Configuration({
    robloxSiteDomain: process.env.robloxSiteDomain,
    basePath: getBEDEV2ServiceBasePath('analytics-watchlists'),
    credentials: 'include',
    unifiedLogger: unifiedLoggerClient,
  }),
);

export type AnalyticsWatchlistsClient = {
  getWatchlist(request: V1WatchlistsWatchlistTypeGetRequest): Promise<Watchlist>;
  upsertWatchlist(request: V1WatchlistsWatchlistTypePostRequest): Promise<Watchlist>;
};

const analyticsWatchlistsClient: AnalyticsWatchlistsClient = {
  async getWatchlist(request) {
    const response = await watchlistsApi.v1WatchlistsWatchlistTypeGet(request);
    if (response.watchlist === undefined) {
      throw new Error('Unhandled empty watchlist');
    }
    return response.watchlist;
  },
  async upsertWatchlist(request) {
    const response = await watchlistsApi.v1WatchlistsWatchlistTypePost(request);
    if (response.watchlist === undefined) {
      throw new Error('Unhandled empty watchlist');
    }
    return response.watchlist;
  },
};

export type { Watchlist };
export default analyticsWatchlistsClient;
