import Fuse, { FuseResult } from 'fuse.js';
import path from 'path';
import Locale from '../localization/enums/Locale';

export type SearchRecommendations = string[];

type RecommendationData = {
  value: string;
};

type ScoredRecommendationData = RecommendationData & {
  rrf: number;
};

type Data = RecommendationData | ScoredRecommendationData;

type SearchData = Data & {
  searchValue: string;
  isPromoted?: boolean;
};

export enum RecommendedSearchType {
  Disabled = 'disabled',
  Titles = 'titles',
  ScoredTitles = 'scoredTitles',
  M1ReleaseVariant1 = 'm1ReleaseVariant1',
  M1ReleaseVariant2 = 'm1ReleaseVariant2',
}

export const isRecommendedSearchEnabled = () =>
  process.env.recommendedSearchType === RecommendedSearchType.Titles ||
  process.env.recommendedSearchType === RecommendedSearchType.ScoredTitles ||
  process.env.recommendedSearchType === RecommendedSearchType.M1ReleaseVariant1 ||
  process.env.recommendedSearchType === RecommendedSearchType.M1ReleaseVariant2;

export const isUnscored = () => process.env.recommendedSearchType === RecommendedSearchType.Titles;

export const isScored = () =>
  process.env.recommendedSearchType === RecommendedSearchType.ScoredTitles ||
  process.env.recommendedSearchType === RecommendedSearchType.M1ReleaseVariant1 ||
  process.env.recommendedSearchType === RecommendedSearchType.M1ReleaseVariant2;

// Smoothing constant for dataset generation (clicks and views) is 50
// We divide by 4 to increase the weight of fuzzy search
const FUZZY_SEARCH_SMOOTHING_CONSTANT = 50 / 4;

// Reciprocal Rank Fusion
const rrf = (rank: number) => 1 / (FUZZY_SEARCH_SMOOTHING_CONSTANT + rank);

const cleanSearchString = (str: string) =>
  str
    .replaceAll(/[^\p{L}\p{N}]/gu, ' ') // remove all non-letter / non-number characters (language-aware, unicode aware)
    .replaceAll(/\s+/g, ' ')
    .toLowerCase();

const cleanSearchValue = (str: string) => cleanSearchString(str).trim();

export const processDatasets = (datasets: Data[][]): SearchData[] =>
  datasets
    .flat()
    // @ts-expect-error - JS sort is stable sort. (undefined - undefined) is NaN, meaning this is no-op for RecommendationData without rrf properties
    .sort((a, b) => b.rrf - a.rrf)
    .map((data: Data) => ({
      ...data,
      searchValue: cleanSearchValue(data.value),
    }));

export const initializeFuse = (dataset: SearchData[]) => {
  return new Fuse(dataset, {
    includeScore: true,
    includeMatches: true,
    threshold: 0.2,
    distance: 50,
    keys: ['searchValue'],
  });
};

export type GetSearchRecommendationsParams = {
  query: string;
  exclusions?: string[];
  limit?: number;
};

// lhoward (2025/07/30): RecommendedSearchClient is a client stub:
//   For v0 we fetch recommendations from the CDN
//     - We use a dataset in the CDN originated from user query logs
//     - Using this dataset, we do fuzzy match in the frontend
//   For v1 we improve the CDN data
//   For v2 we send requests to a backend service
export class RecommendedSearchClient {
  private dataset: Promise<SearchData[]>;

  private datasetCommonSearches: Promise<SearchData[]>;

  private fuse: Promise<Fuse<SearchData>>;

  constructor(locale: Locale) {
    // we get the English locale no matter the user's locale
    // this is because most of our documentation is not translated yet
    const datasetPromises = [RecommendedSearchClient.getDataset(Locale.English)];

    /// / if the user has a locale other than English, fetch it
    if (locale !== Locale.English) {
      datasetPromises.push(RecommendedSearchClient.getDataset(locale));
    }

    // collect into single dataset
    this.dataset = Promise.all(datasetPromises).then((datasets) => processDatasets(datasets));

    this.datasetCommonSearches = this.dataset.then((ds) => [
      // these values take precidence
      { searchValue: 'pls donate', value: 'Game Passes', isPromoted: true },
      { searchValue: 'please donate', value: 'Game Passes', isPromoted: true },
      { searchValue: 'plz donate', value: 'Game Passes', isPromoted: true },
      { searchValue: 't shirt', value: 'Classic Clothing', isPromoted: true },
      { searchValue: 'shirt', value: 'Classic Clothing', isPromoted: true },

      // these are scored recommendations
      ...ds,
    ]);

    this.fuse = this.dataset.then(initializeFuse);
  }

  async prefixSearchRecommendations({
    query,
    exclusions = [],
    limit = 10,
  }: GetSearchRecommendationsParams): Promise<SearchRecommendations> {
    if (!isRecommendedSearchEnabled()) {
      return [];
    }
    const exclusionArray = [cleanSearchValue(query), ...exclusions.map((v) => cleanSearchValue(v))];
    const exclusionSet = new Set(exclusionArray);

    // '   foo   ' -> 'foo '; a final space is allowed because the user might want to separate terms; To match 'Game Passes' from 'Game ' instead of 'GameFoo'
    const cleanedQuery = cleanSearchString(query).trim();
    //  .replace(/^\s+/, '')
    //  .replace(/\s\s+$/, ' ');

    if (!cleanedQuery) return [];

    const ds = await this.datasetCommonSearches;
    // dataset is already sorted from highest score to lowest
    const candidates = [];
    for (let i = 0; i < ds.length && candidates.length < limit; i += 1) {
      const { searchValue, value, isPromoted } = ds[i];
      // promoted results aren't excluded from the exclusion set; ie, if user types 't-shirt', we don't want to exclude 'Game Passes' from the results
      if (searchValue.startsWith(cleanedQuery) && (isPromoted || !exclusionSet.has(searchValue))) {
        candidates.push(value);
      }
    }

    return candidates;
  }

  async fuzzySearchRecommendations({
    query,
    exclusions = [],
  }: GetSearchRecommendationsParams): Promise<SearchRecommendations> {
    if (!isRecommendedSearchEnabled()) {
      // recommendedSearchType is 'disabled' or unset
      return [];
    }

    let exclusionArray: string[] = [];

    switch (process.env.recommendedSearchType) {
      case RecommendedSearchType.ScoredTitles:
      case RecommendedSearchType.Titles:
        // exclude search results + search query
        exclusionArray = [...exclusions.map((v) => cleanSearchValue(v)), cleanSearchValue(query)];
        break;
      case RecommendedSearchType.M1ReleaseVariant2:
        // exclude search query
        exclusionArray = [cleanSearchValue(query)];
        break;
      default:
        // eslint-disable-next-line no-console
        console.error(
          'recommendedSearchClient: Unknown recommendedSearchType',
          process.env.recommendedSearchType,
        );
        return [];
    }

    const exclusionSet = new Set(exclusionArray);

    // '   foo   ' -> 'foo '; a final space is allowed because the user might want to separate terms; To match 'Game Passes' from 'Game ' instead of 'GameFoo'
    const cleanedQuery = cleanSearchString(query)
      .replace(/^\s+/, '')
      .replace(/\s\s+$/, ' ');

    if (!cleanedQuery) {
      return isScored()
        ? (await this.dataset)
            .filter((data) => !exclusionSet.has(data.searchValue))
            .map((data) => data.value)
        : [];
    }

    const fuse = await this.fuse;

    // our first candidate set is those recommendations that fuzzy match the query
    const candidates = fuse
      .search(cleanedQuery)
      // we don't want to recommend the user the exact query they've entered
      // if I query "Game Passes", I don't want to be recommended "Game Passes"; I've already just searched for that
      .filter((candidate: FuseResult<SearchData>) => !exclusionSet.has(candidate.item.searchValue));

    if (!candidates.length) return [];

    if (!isScored()) {
      // with 'titles', we use fuzzy match only - we don't look at precomputed recommendation scores (rrf)
      return candidates.map((result: FuseResult<SearchData>) => result.item.value);
    }

    // Reciprocal Rank Fusion
    // We treat the fuzzy-match as its own dataset.
    // Fuse returns candidates in order from highest score (matching input query) to lowest.
    // We use Fuse's score to merge with the other scores (clicks/views/etc) to get a finalized score
    const rrfCandidates: Array<ScoredRecommendationData & { score: number | void; rank: number }> =
      [
        {
          ...candidates[0].item,
          score: candidates[0].score,
          rank: 1,
          rrf: (candidates[0] as FuseResult<ScoredRecommendationData>).item.rrf + rrf(1),
        },
      ];

    for (let i = 1; i < candidates.length; i += 1) {
      // computes rank and rrf by iterating through candidates
      // rank depends on the previous element; if this element has the same
      // score as the previous element, its rank should be the same
      const { score, item } = candidates[i];
      const { score: prevScore, rank: prevRank } = rrfCandidates[i - 1];

      // compute rank from previous element
      const rank = score === prevScore ? prevRank : prevRank + 1;

      rrfCandidates.push({
        ...item,
        score,
        rank,
        rrf: (item as ScoredRecommendationData).rrf + rrf(rank),
      });
    }

    // sort on rrf from highest to lowest in place; typescript compiler used with nextjs does not allow `toSorted`
    rrfCandidates.sort((a, b) => b.rrf - a.rrf);

    const uniqueCandidates = new Set(rrfCandidates.map((candidate) => candidate.value));

    return [...uniqueCandidates];
  }

  private static async getDataset(locale: Locale): Promise<Data[]> {
    if (typeof window === 'undefined') {
      // prevents nextjs from trying to fetch the dataset on the server;
      // these assets exist in the CDN / nextjs "public" directory, during build nextjs won't know how to find these
      return [];
    }

    let datasetPath: string;

    if (isUnscored()) {
      datasetPath = path.join(
        process.env.staticFilesPrefix || '',
        'data',
        'searchRecommendations',
        'titles',
        `${locale.toLocaleLowerCase()}.json`,
      );
    } else if (isScored()) {
      datasetPath = path.join(
        process.env.staticFilesPrefix || '',
        'data',
        'searchRecommendations',
        'scoredTitles',
        `${locale.toLocaleLowerCase()}.json`,
      );
    } else {
      return [];
    }
    const response = await fetch(datasetPath);
    return response.json();
  }

  async getSearchRecommendations(
    params: GetSearchRecommendationsParams,
  ): Promise<SearchRecommendations> {
    if (process.env.recommendedSearchType === RecommendedSearchType.M1ReleaseVariant1) {
      return this.prefixSearchRecommendations(params);
    }
    return this.fuzzySearchRecommendations(params);
  }
}
