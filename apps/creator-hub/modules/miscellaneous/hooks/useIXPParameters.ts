import { useEffect, useState } from 'react';
import type { IXPLayers, TIXPParameterResults } from '@modules/clients/ixpExperiments';
import { fetchIXPParametersForCurrentUser } from '@modules/clients/ixpExperiments';

export const getValueFromStorage = <Layer extends IXPLayers>(
  key: Layer,
  initialValue: Partial<TIXPParameterResults[Layer]> = {},
) => {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue;
  } catch {
    return initialValue;
  }
};

export const writeValueToStorage = <Layer extends IXPLayers>(
  key: Layer,
  value: Partial<TIXPParameterResults[Layer]> = {},
) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Unable to write to local storage', error);
  }
};

export type TIXPParametersInfo<Layer extends IXPLayers> = {
  status: 'initial' | 'loading' | 'error' | 'success';
  isFetched: boolean;
  params: Partial<TIXPParameterResults[Layer]>;
};

/**
 * Fetch IXP parameters for the current user for a given layer with optional
 * cached value.
 *
 * NOTE: It does not support changing the layer after the initial render.
 *       for that use-case you should use multiple hooks instead. This constraint
 *       keeps the hook simple and avoids unnecessary complexity.
 */
export default function useIXPParameters<Layer extends IXPLayers>(
  /**
   * The layer to fetch the parameters for
   * NOTE: Only the initial value is used.
   */
  layer: Layer,
  options?: {
    /**
     * When enabled will use data from local storage to populate the params before
     * we get fresh data from IXP (assuming it has been fetched before).
     * This can be useful to avoid flickering, especially if you need the ixp param
     * early in the cycle. Otherwise, all values will always start out as `undefined`
     * until the data is fetched if you use the data before `status === 'success'`
     */
    restoreInitialValueFromCache?: boolean;
    /**
     * When enabled, only reads from the localStorage cache and does NOT fetch from IXP.
     * This avoids triggering IXP enrollment (access events) for the layer.
     * Use this on pages that need IXP param values but should not be enrollment points.
     */
    cacheOnly?: boolean;
  },
): TIXPParametersInfo<Layer> {
  const cacheOnly = options?.cacheOnly ?? false;

  const [info, setInfo] = useState<TIXPParametersInfo<Layer>>(() => {
    if (cacheOnly) {
      return {
        params: getValueFromStorage(layer),
        status: 'success',
        isFetched: true,
      };
    }
    return {
      params: options?.restoreInitialValueFromCache ? getValueFromStorage(layer) : {},
      status: 'initial',
      isFetched: false,
    };
  });

  useEffect(() => {
    if (cacheOnly) {
      return;
    }

    const getIXPParams = async () => {
      let params = {};
      try {
        setInfo((oldParams) => ({
          ...oldParams,
          status: 'loading',
        }));
        params = await fetchIXPParametersForCurrentUser(layer);
        setInfo({
          params,
          isFetched: true,
          status: 'success',
        });
        writeValueToStorage(layer, params);
      } catch {
        setInfo((oldParams) => ({
          ...oldParams,
          isFetched: true,
          status: 'error',
        }));
      }
    };

    getIXPParams();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- This effect should only run once on startup
  }, []);

  return info;
}
