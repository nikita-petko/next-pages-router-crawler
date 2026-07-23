/* istanbul ignore file */
import { createContext, useContext, useMemo } from 'react';
import type { DeveloperProductConfigV2 } from '@rbx/client-developer-products-api/v1';
import { useGetDeveloperProductConfig } from '@modules/developer-products/queries/useGetDeveloperProductConfig';
import { useProductId } from '@modules/monetization-shared/route/useProductId';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';

type TDeveloperProductContext = Pick<
  ReturnType<typeof useGetDeveloperProductConfig>,
  // Only expose the following in-use properties for now. Add more as needed.
  'isLoading' | 'isPending' | 'isError' | 'isStale' | 'isRefetching'
> & {
  developerProductDetails?: DeveloperProductConfigV2;
};

const DeveloperProductContext = createContext<TDeveloperProductContext>({
  developerProductDetails: undefined,
  isLoading: false,
  isPending: false,
  isError: false,
  isStale: false,
  isRefetching: false,
});

/**
 * Context for providing developer product details on the current page, if it exists.
 * This is used for legacy surfaces where the developer product details may not be fetched directly,
 * and components instead use default context values.
 *
 * Prefer using the {@link useGetDeveloperProductConfig} hook directly in components
 * that need the developer product details - this is also globally cached and will be more flexible.
 */
export function useCurrentDeveloperProduct() {
  return useContext(DeveloperProductContext);
}

export const DeveloperProductProvider = ({ children }: React.PropsWithChildren) => {
  const { universeId } = useUniverseId();
  const { productId } = useProductId();

  const result = useGetDeveloperProductConfig(
    // oxlint-disable-next-line typescript/no-non-null-assertion -- guarded by enabled flag
    { universeId: universeId!, productId: productId! },
    { enabled: !!productId && !!universeId },
  );

  return (
    <DeveloperProductContext.Provider
      value={useMemo(() => ({ ...result, developerProductDetails: result.data }), [result])}>
      {children}
    </DeveloperProductContext.Provider>
  );
};
