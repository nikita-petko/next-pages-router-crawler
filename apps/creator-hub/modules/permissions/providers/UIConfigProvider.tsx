import React, { createContext, FunctionComponent, PropsWithChildren, useContext } from 'react';
import { UIConfig } from '../utils/types';

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
