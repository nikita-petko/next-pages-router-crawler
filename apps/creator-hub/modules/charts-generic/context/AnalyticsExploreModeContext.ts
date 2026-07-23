import { createContext, useContext } from 'react';

const AnalyticsExploreModeContext = createContext(false);

export const useIsInAnalyticsExploreMode = () => useContext(AnalyticsExploreModeContext);

export const AnalyticsExploreModeProvider = AnalyticsExploreModeContext.Provider;
