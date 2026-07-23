import type {
  V1WatchlistsWatchlistTypeGetRequest,
  Watchlist,
  V1WatchlistsWatchlistTypePostRequest,
} from '@rbx/client-analytics-watchlists/v1';
import { AnalyticsWatchlistsAPIApi } from '@rbx/client-analytics-watchlists/v1';
import { createClientConfiguration } from '../utils/createClientConfiguration';

const watchlistsApi = new AnalyticsWatchlistsAPIApi(
  createClientConfiguration('analytics-watchlists', 'bedev2'),
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
