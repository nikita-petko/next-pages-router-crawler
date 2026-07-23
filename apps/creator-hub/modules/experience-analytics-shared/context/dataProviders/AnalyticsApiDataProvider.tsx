import type { FunctionComponent } from 'react';
import React, { useContext, useMemo } from 'react';
import type { TUseApiRequestOptions } from '../../hooks/useApiRequest';
import useApiRequest from '../../hooks/useApiRequest';

type AnalyticsApiDataProviderSpec<T> = {
  fetchApi: () => Promise<T | null>;
  options?: TUseApiRequestOptions;
};

export type AnalyticsApiDataState<T> = {
  data: T | null;
  isLoading: boolean;
  isUserForbidden: boolean;
  isResponseFailed: boolean;
  refresh: () => void;
};

const getAnalyticsApiDataProvider = <T,>() => {
  const AnalyticsApiDataContext = React.createContext<AnalyticsApiDataState<T> | null>(null);

  const useAnalyticsApiData = (): AnalyticsApiDataState<T> => {
    const data = useContext(AnalyticsApiDataContext);
    if (data === null) {
      throw new Error('useAnalyticsApiData must be used within an AnalyticsApiDataProvider');
    }
    return data;
  };

  const AnalyticsApiDataProvider: FunctionComponent<
    React.PropsWithChildren<AnalyticsApiDataProviderSpec<T>>
  > = ({ children, fetchApi, options }) => {
    const {
      data: response,
      isDataLoading: isLoading,
      isUserForbidden,
      isResponseFailed,
      refresh,
    } = useApiRequest(fetchApi, options);

    const context = useMemo(() => {
      return {
        data: response,
        isLoading,
        isUserForbidden,
        isResponseFailed,
        refresh,
      };
    }, [isLoading, isResponseFailed, isUserForbidden, refresh, response]);

    return (
      <AnalyticsApiDataContext.Provider value={context}>
        {children}
      </AnalyticsApiDataContext.Provider>
    );
  };

  return {
    useAnalyticsApiData,
    AnalyticsApiDataProvider,
    AnalyticsApiDataContext,
  };
};

export default getAnalyticsApiDataProvider;
