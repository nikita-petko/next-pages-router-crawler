import React, { type FunctionComponent, createContext, useState, useMemo } from 'react';

export type LeftNavigationStateContextValue = {
  primarySidebarExpanded: boolean;
  setPrimarySidebarExpanded?: (value: boolean) => void;
};
const defaultContextValue: LeftNavigationStateContextValue = {
  primarySidebarExpanded: false,
  setPrimarySidebarExpanded: () => {
    throw new Error(
      'Function not implemented. You may be trying to use this context outside of a provider.',
    );
  },
};

const LeftNavigationStateContext =
  createContext<LeftNavigationStateContextValue>(defaultContextValue);
LeftNavigationStateContext.displayName = 'LeftNavigationStateContext';

export const LeftNavigationStateProvider: FunctionComponent<React.PropsWithChildren> = ({
  children,
}) => {
  const [primarySidebarExpanded, setPrimarySidebarExpanded] = useState(true);
  const memorizedContextValue = useMemo(
    () => ({
      primarySidebarExpanded,
      setPrimarySidebarExpanded,
    }),
    [primarySidebarExpanded],
  );
  return (
    <LeftNavigationStateContext.Provider value={memorizedContextValue}>
      {children}
    </LeftNavigationStateContext.Provider>
  );
};

export default LeftNavigationStateContext;
