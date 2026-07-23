import type { FunctionComponent, PropsWithChildren } from 'react';
import React, { createContext, useContext } from 'react';
import type { UIConfig } from '../utils/types';

const UIConfigContext = createContext<UIConfig | null>(null);

export const UIConfigProvider: FunctionComponent<PropsWithChildren<UIConfig>> = ({
  children,
  ...config
}) => {
  return <UIConfigContext.Provider value={config}>{children}</UIConfigContext.Provider>;
};

export function useUiConfig(): UIConfig {
  const uiConfig = useContext(UIConfigContext);
  if (!uiConfig) {
    throw new Error('useUiConfig must be used within a UIConfigProvider');
  }
  return uiConfig;
}
