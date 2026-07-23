import React, { FunctionComponent, useEffect } from 'react';
import { Locale } from '@rbx/intl';
import { SearchRecommendations } from '../../clients/recommendedSearchClient';
import { useSearchConfig } from '../../contexts/SearchConfigContext';
import { trackSearchRecommendationImpression } from '../searchEvents';
import useRecommendedSearch from './hooks/useRecommendedSearch';

interface RenderRecommendationsProps {
  recommendations: SearchRecommendations;
}

interface RecommendedSearchProps {
  impressionRef: React.MutableRefObject<string | null>;
  locale: Locale;
  maxRecommendations?: number;
  renderRecommendations: React.FC<RenderRecommendationsProps>;
  searchQuery: string;
  searchSessionId: string;
}

const RecommendedSearch: FunctionComponent<React.PropsWithChildren<RecommendedSearchProps>> = ({
  impressionRef,
  locale,
  maxRecommendations = 1,
  renderRecommendations,
  searchQuery,
  searchSessionId,
}) => {
  const { currentProduct, eventLogger } = useSearchConfig();
  const { recommendations, isEnabled, setRecommendationQuery } = useRecommendedSearch();

  useEffect(() => {
    if (!isEnabled || !searchSessionId || impressionRef.current === searchSessionId) return;
    // eslint-disable-next-line no-param-reassign
    impressionRef.current = searchSessionId;
    trackSearchRecommendationImpression({
      eventLogger,
      locale,
      query: searchQuery,
      recommendation: recommendations[0],
      currentProduct,
      searchSessionId,
    });
  }, [
    eventLogger,
    searchSessionId,
    isEnabled,
    impressionRef,
    locale,
    searchQuery,
    currentProduct,
    recommendations,
  ]);

  useEffect(() => {
    if (!isEnabled) return;

    setRecommendationQuery(searchQuery);
  }, [isEnabled, searchQuery, setRecommendationQuery]);

  return isEnabled && recommendations.length
    ? renderRecommendations({
        recommendations: recommendations.slice(0, maxRecommendations),
      })
    : null;
};

export default RecommendedSearch;
