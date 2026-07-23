import type { Dispatch, SetStateAction } from 'react';
import { createContext } from 'react';
import type { SearchRecommendations } from '../../../clients/recommendedSearchClient';

export const getSearchRecommendationsNoop = async () => [];

export type RecommendedSearchContext = {
  isEnabled: boolean;
  setRecommendationQuery: Dispatch<SetStateAction<string>>;
  setExclusions: Dispatch<SetStateAction<string[]>>;
  recommendations: SearchRecommendations;
};

const RecommendedSearchContext = createContext<RecommendedSearchContext>({
  isEnabled: false,
  setRecommendationQuery: () => {
    throw new Error('setRecommendationQuery not implemented');
  },
  setExclusions: () => {
    throw new Error('setDoNotRecommendArray not implemented');
  },
  recommendations: [],
});
RecommendedSearchContext.displayName = 'RecommendedSearch';

export default RecommendedSearchContext;
