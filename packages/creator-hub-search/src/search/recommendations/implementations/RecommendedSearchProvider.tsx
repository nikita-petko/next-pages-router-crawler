import React, { FunctionComponent, useEffect, useMemo, useState } from 'react';
import useCurrentLocale from '../../../localization/hooks/useCurrentLocale';
import {
  isRecommendedSearchEnabled,
  RecommendedSearchClient,
  SearchRecommendations,
} from '../../../clients/recommendedSearchClient';
import RecommendedSearchContext, {
  getSearchRecommendationsNoop,
} from '../interfaces/RecommendedSearchContext';

const RecommendedSearchProvider: FunctionComponent<React.PropsWithChildren> = ({ children }) => {
  const { targetLocale } = useCurrentLocale();
  const isEnabled = isRecommendedSearchEnabled();
  const [recommendationQuery, setRecommendationQuery] = useState('');
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<SearchRecommendations>([]);

  const getSearchRecommendations = useMemo(() => {
    if (!isEnabled) {
      return getSearchRecommendationsNoop;
    }
    const client = new RecommendedSearchClient(targetLocale);
    return client.getSearchRecommendations.bind(client);
  }, [isEnabled, targetLocale]);

  useEffect(() => {
    if (!isEnabled) {
      setRecommendations([]);
      return;
    }
    getSearchRecommendations({
      query: recommendationQuery,
      exclusions: recommendationQuery.trim().length ? exclusions : [],
    }).then(setRecommendations);
  }, [recommendationQuery, exclusions, getSearchRecommendations, isEnabled]);

  return (
    <RecommendedSearchContext.Provider
      // eslint-disable-next-line react/jsx-no-constructed-context-values
      value={{
        isEnabled,
        setRecommendationQuery,
        setExclusions,
        recommendations,
      }}>
      {children}
    </RecommendedSearchContext.Provider>
  );
};

export default RecommendedSearchProvider;
