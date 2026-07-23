import { useContext } from 'react';
import RecommendedSearchContext from '../interfaces/RecommendedSearchContext';

export default function useRecommendedSearch() {
  return useContext(RecommendedSearchContext);
}
