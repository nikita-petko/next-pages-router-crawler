import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { useFlag } from '@rbx/flags';
import {
  isCustomDashboardsApiBackendEnabled as isCustomDashboardsApiBackendEnabledFlag,
  isCustomDashboardsEnabled as isCustomDashboardsEnabledFlag,
  isCustomDashboardsLocalStorageEnabled as isCustomDashboardsLocalStorageEnabledFlag,
} from '@generated/flags/creatorAnalytics';
import { useAnalyticsExperiencePermissions } from '@modules/experience-analytics-shared/hooks/useAnalyticsPermissions';
import { uninitializedUniverseId } from '@modules/miscellaneous/common';
import { CustomDashboardNotAvailableError } from '../errors';
import ApiCustomDashboardService from './ApiCustomDashboardService';
import { createDefaultCustomDashboardsApiClient } from './customDashboardsApiClient';
import type { CustomDashboardService } from './CustomDashboardService';
import HybridCustomDashboardService from './HybridCustomDashboardService';
import InMemoryCustomDashboardService from './InMemoryCustomDashboardService';
import LocalStorageCustomDashboardService from './LocalStorageCustomDashboardService';
import ReadOnlyCustomDashboardService from './ReadOnlyCustomDashboardService';

type CustomDashboardServiceConfig = {
  readonly isEnabled: boolean;
  readonly isLocalStorageEnabled: boolean;
  readonly isApiBackendEnabled: boolean;
  readonly canSaveCustomDashboards: boolean;
};

type CustomDashboardServiceContextValue = {
  readonly service: CustomDashboardService;
  /** False until feature flags and any required permissions select a backend. */
  readonly isReady: boolean;
  readonly isApiBacked: boolean;
  /** False when the active backend cannot persist mutations (read-only API). */
  readonly canMutateDashboards: boolean;
  readonly getServiceForConfig: (config: CustomDashboardServiceConfig) => CustomDashboardService;
};

const noopCustomDashboardService: CustomDashboardService = {
  async list() {
    return { items: [], migrationFailedCount: 0 };
  },
  async get() {
    throw new CustomDashboardNotAvailableError();
  },
  async create() {
    throw new CustomDashboardNotAvailableError();
  },
  async createAndPublish() {
    throw new CustomDashboardNotAvailableError();
  },
  async update() {
    throw new CustomDashboardNotAvailableError();
  },
  async addChartTile() {
    throw new CustomDashboardNotAvailableError();
  },
  async delete() {
    throw new CustomDashboardNotAvailableError();
  },
  async duplicate() {
    throw new CustomDashboardNotAvailableError();
  },
  async publish() {
    throw new CustomDashboardNotAvailableError();
  },
  async unpublish() {
    throw new CustomDashboardNotAvailableError();
  },
  async pin() {
    throw new CustomDashboardNotAvailableError();
  },
  async unpin() {
    throw new CustomDashboardNotAvailableError();
  },
  async suggestDefaultName() {
    throw new CustomDashboardNotAvailableError();
  },
  async getVersion() {
    return null;
  },
  subscribe() {
    return () => undefined;
  },
};

function createLocalService(): CustomDashboardService {
  if (typeof window !== 'undefined') {
    try {
      if (window.localStorage) {
        return new LocalStorageCustomDashboardService();
      }
    } catch {
      // Fall through to in-memory.
    }
  }
  return new InMemoryCustomDashboardService();
}

function configCacheKey(config: CustomDashboardServiceConfig): string {
  if (!config.isEnabled) {
    return 'disabled';
  }
  if (config.isApiBackendEnabled) {
    if (config.canSaveCustomDashboards) {
      return 'enabled:api:writable';
    }
    return config.isLocalStorageEnabled ? 'enabled:hybrid' : 'enabled:api:readonly';
  }
  return config.isLocalStorageEnabled ? 'enabled:localStorage' : 'enabled:inMemory';
}

function canMutateForConfig(config: CustomDashboardServiceConfig): boolean {
  if (!config.isEnabled) {
    return false;
  }
  if (config.isApiBackendEnabled) {
    // Writable API when canSave; hybrid still mutates locally when canSave is false.
    return config.canSaveCustomDashboards || config.isLocalStorageEnabled;
  }
  return true;
}

/** Default service factory; selects noop / local / API / hybrid / read-only from flags + permissions. */
export function createDefaultCustomDashboardService(
  config: CustomDashboardServiceConfig,
): CustomDashboardService {
  if (!config.isEnabled) {
    return noopCustomDashboardService;
  }

  // Never construct or call the API client unless the API backend flag is on.
  if (config.isApiBackendEnabled) {
    const apiService = new ApiCustomDashboardService(createDefaultCustomDashboardsApiClient());
    if (config.canSaveCustomDashboards) {
      // Server writes allowed — use pure API even if localStorage is also on.
      return apiService;
    }
    if (config.isLocalStorageEnabled) {
      return new HybridCustomDashboardService({
        apiService,
        localService: createLocalService(),
      });
    }
    return new ReadOnlyCustomDashboardService(apiService);
  }

  if (!config.isLocalStorageEnabled) {
    return new InMemoryCustomDashboardService();
  }

  return createLocalService();
}

const CustomDashboardServiceContext = createContext<CustomDashboardServiceContextValue | null>(
  null,
);

type ProviderProps = React.PropsWithChildren<{
  readonly service?: CustomDashboardService;
  /** Override when injecting a test service; defaults to true for injected services. */
  readonly canMutateDashboards?: boolean;
  /** Override when injecting an API-shaped Storybook or test service. */
  readonly isApiBacked?: boolean;
}>;

export const CustomDashboardServiceProvider: React.FC<ProviderProps> = ({
  service,
  canMutateDashboards = true,
  isApiBacked = false,
  children,
}) => {
  const servicesByConfigKeyRef = useRef(new Map<string, CustomDashboardService>());

  const getServiceForConfig = useCallback(
    (config: CustomDashboardServiceConfig): CustomDashboardService => {
      if (service) {
        return service;
      }

      const key = configCacheKey(config);
      const cached = servicesByConfigKeyRef.current.get(key);
      if (cached) {
        return cached;
      }

      const nextService = createDefaultCustomDashboardService(config);
      servicesByConfigKeyRef.current.set(key, nextService);
      return nextService;
    },
    [service],
  );

  const resolved = service ?? noopCustomDashboardService;

  useEffect(() => {
    const servicesByConfigKey = servicesByConfigKeyRef.current;
    return () => {
      servicesByConfigKey.forEach((ownedService) => ownedService.dispose?.());
      servicesByConfigKey.clear();
    };
  }, []);

  const value = useMemo(
    () => ({
      service: resolved,
      isReady: service !== undefined,
      isApiBacked: service ? isApiBacked : false,
      // Injected services are assumed mutable unless the caller opts out.
      canMutateDashboards: service ? canMutateDashboards : false,
      getServiceForConfig,
    }),
    [canMutateDashboards, getServiceForConfig, isApiBacked, resolved, service],
  );

  return (
    <CustomDashboardServiceContext.Provider value={value}>
      {children}
    </CustomDashboardServiceContext.Provider>
  );
};

function useUniverseIdFromRouter(): number {
  const router = useRouter();
  const rawId = router.query.id;
  if (typeof rawId === 'string') {
    const parsed = Number.parseInt(rawId, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return uninitializedUniverseId;
}

export const UniverseFlaggedCustomDashboardProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const parent = useContext(CustomDashboardServiceContext);
  if (!parent) {
    throw new Error(
      'UniverseFlaggedCustomDashboardProvider must be used within CustomDashboardServiceProvider.',
    );
  }

  const universeId = useUniverseIdFromRouter();
  const {
    canSaveCustomDashboards,
    isPending: isPermissionsPending,
    isError: isPermissionsError,
  } = useAnalyticsExperiencePermissions(universeId);

  const { ready: isCustomDashboardsReady, value: isCustomDashboardsEnabled } = useFlag(
    isCustomDashboardsEnabledFlag,
  );
  const {
    ready: isCustomDashboardsLocalStorageReady,
    value: isCustomDashboardsLocalStorageEnabled,
  } = useFlag(isCustomDashboardsLocalStorageEnabledFlag);
  const { ready: isCustomDashboardsApiBackendReady, value: isCustomDashboardsApiBackendEnabled } =
    useFlag(isCustomDashboardsApiBackendEnabledFlag);

  const flagsReady =
    isCustomDashboardsReady &&
    isCustomDashboardsLocalStorageReady &&
    isCustomDashboardsApiBackendReady;

  // When the API backend is on, wait for feature-permissions so we do not
  // briefly construct a writable API client for view-only users.
  const permissionsReadyForApi =
    !isCustomDashboardsApiBackendEnabled ||
    universeId === uninitializedUniverseId ||
    !isPermissionsPending ||
    isPermissionsError;

  const serviceConfig = useMemo((): CustomDashboardServiceConfig | null => {
    if (!flagsReady || !permissionsReadyForApi) {
      return null;
    }
    return {
      isEnabled: isCustomDashboardsEnabled,
      isLocalStorageEnabled: isCustomDashboardsLocalStorageEnabled,
      isApiBackendEnabled: isCustomDashboardsApiBackendEnabled,
      // On permission fetch failure, deny saves (fail closed).
      canSaveCustomDashboards: !isPermissionsError && canSaveCustomDashboards,
    };
  }, [
    canSaveCustomDashboards,
    flagsReady,
    isCustomDashboardsApiBackendEnabled,
    isCustomDashboardsEnabled,
    isCustomDashboardsLocalStorageEnabled,
    isPermissionsError,
    permissionsReadyForApi,
  ]);

  const serviceForUniverseFlags = useMemo(() => {
    if (!serviceConfig) {
      return parent.service;
    }
    return parent.getServiceForConfig(serviceConfig);
  }, [parent, serviceConfig]);

  const canMutateDashboards = useMemo(() => {
    if (!serviceConfig) {
      return parent.canMutateDashboards;
    }
    return canMutateForConfig(serviceConfig);
  }, [parent.canMutateDashboards, serviceConfig]);

  const value = useMemo(
    () => ({
      ...parent,
      service: serviceForUniverseFlags,
      isReady: serviceConfig !== null,
      isApiBacked: serviceConfig?.isApiBackendEnabled ?? false,
      canMutateDashboards,
    }),
    [canMutateDashboards, parent, serviceConfig, serviceForUniverseFlags],
  );

  return (
    <CustomDashboardServiceContext.Provider value={value}>
      {children}
    </CustomDashboardServiceContext.Provider>
  );
};

export function useCustomDashboardService(): CustomDashboardService {
  const ctx = useContext(CustomDashboardServiceContext);
  if (!ctx) {
    throw new Error(
      'useCustomDashboardService() must be used within a CustomDashboardServiceProvider.',
    );
  }
  return ctx.service;
}

export function useCustomDashboardsBackendState(): {
  readonly isReady: boolean;
  readonly isApiBacked: boolean;
} {
  const ctx = useContext(CustomDashboardServiceContext);
  if (!ctx) {
    throw new Error(
      'useCustomDashboardsBackendState() must be used within CustomDashboardServiceProvider.',
    );
  }
  return { isReady: ctx.isReady, isApiBacked: ctx.isApiBacked };
}

export function useCanMutateCustomDashboards(): boolean {
  const ctx = useContext(CustomDashboardServiceContext);
  if (!ctx) {
    throw new Error(
      'useCanMutateCustomDashboards() must be used within a CustomDashboardServiceProvider.',
    );
  }
  return ctx.canMutateDashboards;
}
