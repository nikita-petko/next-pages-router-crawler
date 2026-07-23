import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toolboxClient } from '@modules/clients';
import type { FrontendFlagsGetValuesRequest } from '@rbx/clients/toolboxService';
import {
  DEFAULT_FRONTEND_FLAGS,
  FRONTEND_FLAG_NAMES,
  FrontendFlags,
} from './toolboxFeatureManagement';

export type ToolboxServiceApiProvider = {
  children?: React.ReactNode;
};

export type ToolboxServiceApiProviderContext = {
  frontendFlags: FrontendFlags;
  getFrontendFlags: (frontendFlagsGetValuesRequest: FrontendFlagsGetValuesRequest) => Promise<void>;
  loadingFrontendFlags: boolean;
};
export const ToolboxServiceApiProviderContext =
  createContext<ToolboxServiceApiProviderContext | null>(null);

const ToolboxServiceApiProvider = ({ children }: ToolboxServiceApiProvider): React.JSX.Element => {
  const [frontendFlags, setFrontendFlags] = useState<FrontendFlags>(DEFAULT_FRONTEND_FLAGS);
  const [loadingFrontendFlags, setLoadingFrontendFlags] = useState<boolean>(false);

  const getFrontendFlags = useCallback(
    async (request: FrontendFlagsGetValuesRequest): Promise<void> => {
      try {
        const flagValues = await toolboxClient.getFrontendFlagsValues(request);

        // Go through FLAGS_NAMES and assign response value; if does not exist, default to false
        const newFrontendFlags: FrontendFlags = Object.assign(
          {},
          ...FRONTEND_FLAG_NAMES.map((flagName) => ({
            [flagName]: flagValues?.data?.[flagName] ?? false,
          })),
        );

        setFrontendFlags(newFrontendFlags);
      } catch {
        // currently we swallow these errors. the network requests are still logged in the console if they fail.
      }
    },
    [],
  );

  // Get frontend flags when the provider loads.
  useEffect(() => {
    let isMounted = true;
    const frontendFlagsGetValuesRequest: FrontendFlagsGetValuesRequest = {
      flags: FRONTEND_FLAG_NAMES,
    };
    setLoadingFrontendFlags(true);
    (async () => {
      await getFrontendFlags(frontendFlagsGetValuesRequest);
      if (isMounted) {
        setLoadingFrontendFlags(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [getFrontendFlags]);

  const value = useMemo(() => {
    return {
      frontendFlags,
      getFrontendFlags,
      loadingFrontendFlags,
    };
  }, [frontendFlags, getFrontendFlags, loadingFrontendFlags]);

  return (
    <ToolboxServiceApiProviderContext.Provider value={value}>
      {children}
    </ToolboxServiceApiProviderContext.Provider>
  );
};

export default ToolboxServiceApiProvider;

export function useToolboxServiceApiProvider(): ToolboxServiceApiProviderContext {
  const context = useContext(ToolboxServiceApiProviderContext);
  if (context === null) {
    throw new Error('useToolboxServiceApiProvider must be used within a ToolboxServiceApiProvider');
  }
  return context;
}
