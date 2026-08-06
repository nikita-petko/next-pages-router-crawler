import type { QueryClient } from '@tanstack/react-query';
import { developerProductKeys } from '@modules/developer-products/queries/constants';
import { gamePassKeys } from '@modules/passes/queries/constants';
import type { Product } from '../types/product';

type UseGetProductsResult = {
  products: Product[];
  isLoading: boolean;
  isError: boolean;
};

export function invalidateProductQueries(queryClient: QueryClient, universeId: number) {
  void queryClient.invalidateQueries({
    queryKey: gamePassKeys.all(universeId),
  });
  void queryClient.invalidateQueries({
    queryKey: developerProductKeys.all(universeId),
  });
}

const EMPTY_PRODUCTS: Product[] = [];

// Temporary stand-in as we migrate to managed pricing
// We're still using the old summary cards / timeline / results to brainstorm how to improve MP experience,
// but we no longer have need for products.
// oxlint-disable-next-line no-unused-vars -- still keeping this hook around for now
export function useGetProducts(_forceShowExperimentProducts = false): UseGetProductsResult {
  return {
    products: EMPTY_PRODUCTS,
    isLoading: false,
    isError: false,
  };
}
