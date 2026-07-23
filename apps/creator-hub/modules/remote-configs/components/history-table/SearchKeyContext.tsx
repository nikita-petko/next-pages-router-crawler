import React, { createContext, useContext } from 'react';

const SearchKeyContext = createContext<string | null>(null);

export const SearchKeyProvider = ({
  searchKey,
  children,
}: {
  searchKey: string | null;
  children: React.ReactNode;
}) => {
  return <SearchKeyContext.Provider value={searchKey}>{children}</SearchKeyContext.Provider>;
};

export const useSearchKey = () => {
  return useContext(SearchKeyContext);
};
