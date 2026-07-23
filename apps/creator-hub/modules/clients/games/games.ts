import type {
  RobloxGamesApiModelsResponseGameDetailResponse,
  RobloxWebWebAPIModelsApiArrayResponseRobloxGamesApiModelsResponseGameDetailResponse,
  V1GamesGetRequest,
  V1GamesUniverseIdSocialLinksListGetRequest,
  RobloxGamesApiSocialLinkResponse,
  V1GamesUniverseIdMediaGetRequest,
  RobloxWebWebAPIModelsApiArrayResponseRobloxGamesApiModelsResponseGameMediaItem,
  V1GamesMultigetPlaceDetailsGetRequest,
  RobloxGamesApiModelsResponsePlaceDetails,
  V1GamesVotesGetRequest,
  RobloxWebWebAPIModelsApiArrayResponseRobloxGamesApiModelsResponseGameVoteResponse,
  RobloxGamesApiModelsResponseGameRecommendationsResponse,
  RobloxGamesApiModelsResponseGameResponseModel,
} from '@rbx/client-games/v1';
import {
  GamesApi as GamesApiV1,
  SocialLinksApi,
  RobloxGamesApiSocialLinkResponseTypeEnum as SocialLinkTypes,
  VotesApi,
} from '@rbx/client-games/v1';
import { createClientConfiguration } from '../utils/createClientConfiguration';

export { SocialLinkTypes };

const defaultConfiguration = createClientConfiguration('games', 'bedev1');

const gamesApiV1 = new GamesApiV1(defaultConfiguration);
const socialLinksApi = new SocialLinksApi(defaultConfiguration);
const votesApi = new VotesApi(defaultConfiguration);

/**
 * This is a testing only export that exposes the gamesApiV1 instance to simplify
 * mocking (since gamesApiV1 isn't currently exported). Only use in tests.
 */
export const testingOnlyGamesApiV1 = gamesApiV1;

export type GamesDetailsResponse =
  RobloxWebWebAPIModelsApiArrayResponseRobloxGamesApiModelsResponseGameDetailResponse;
export type GameDetailResponse = RobloxGamesApiModelsResponseGameDetailResponse;
export type GameMediaResponse =
  RobloxWebWebAPIModelsApiArrayResponseRobloxGamesApiModelsResponseGameMediaItem;
export type MultigetPlaceResponse = RobloxGamesApiModelsResponsePlaceDetails[];
export type MultigetGameVotesResponse =
  RobloxWebWebAPIModelsApiArrayResponseRobloxGamesApiModelsResponseGameVoteResponse;
export type GameRecommendationsResponse = RobloxGamesApiModelsResponseGameRecommendationsResponse;
export type RecommendedGameDetail = RobloxGamesApiModelsResponseGameResponseModel;
type LinkId = number | null;
type LinkType = SocialLinkTypes | null;
export type SocialLinksData = Required<
  Omit<RobloxGamesApiSocialLinkResponse, 'id' | 'type'> & { linkId: LinkId; linkType: LinkType }
>;
export type SocialLinksResponse = {
  data: Array<SocialLinksData>;
  socialLinksVerificationStatus: number;
};

export interface GamesClient {
  getDetails(universeIds: Array<number>): Promise<GamesDetailsResponse>;
  getSocialLinks(universeId: number): Promise<SocialLinksResponse>;
  getGameMedia(universeId: number): Promise<GameMediaResponse>;
  multigetPlaceDetails(placeIds: number[]): Promise<MultigetPlaceResponse>;
  multigetGameVotes(universeIds: number[]): Promise<MultigetGameVotesResponse>;

  getGameRecommendations(
    universeId: number,
    paginationKey?: string,
  ): Promise<GameRecommendationsResponse>;
}

const gamesClient: GamesClient = {
  getDetails(universeIds: Array<number>) {
    const request: V1GamesGetRequest = { universeIds };
    return gamesApiV1.v1GamesGet(request);
  },
  async getSocialLinks(universeId: number) {
    const request: V1GamesUniverseIdSocialLinksListGetRequest = { universeId };
    const response = await socialLinksApi.v1GamesUniverseIdSocialLinksListGet(request);
    return {
      ...response,
      // oxlint-disable-next-line no-unnecessary-type-conversion -- runtime value may differ from declared type
      socialLinksVerificationStatus: Number(response.socialLinksVerificationStatus ?? 0),
      data:
        response.data
          ?.filter((item) => ![item.id, item.title, item.type, item.url].includes(undefined))
          .map(
            (item) =>
              // oxlint-disable-next-line no-unsafe-type-assertion -- narrowed by filter above
              ({
                linkId: item.id,
                title: item.title,
                url: item.url,
                linkType: item.type,
              }) as SocialLinksData,
          ) ?? [],
    };
  },
  getGameMedia(universeId: number) {
    const request: V1GamesUniverseIdMediaGetRequest = { universeId };
    return gamesApiV1.v1GamesUniverseIdMediaGet(request);
  },
  multigetPlaceDetails(placeIds: number[]) {
    const request: V1GamesMultigetPlaceDetailsGetRequest = { placeIds };
    return gamesApiV1.v1GamesMultigetPlaceDetailsGet(request);
  },
  multigetGameVotes(universeIds: number[]) {
    const request: V1GamesVotesGetRequest = { universeIds };
    return votesApi.v1GamesVotesGet(request);
  },
  getGameRecommendations(universeId: number, paginationKey?: string) {
    return gamesApiV1.v1GamesRecommendationsGameUniverseIdGet({
      universeId,
      paginationKey: paginationKey ?? '',
      maxRows: 18,
      isTruncatedResultsEnabled: false,
    });
  },
};

export default gamesClient;
