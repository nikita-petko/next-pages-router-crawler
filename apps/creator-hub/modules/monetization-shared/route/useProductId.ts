import { useRouter } from 'next/router';

/**
 * Retrieves the product ID from the path. Should never error within this
 * module - the page will not load if a product ID is not present.
 *
 * Use this to reduce dependent queries and minmimize request waterfall.
 */
export function useProductId() {
  const router = useRouter();
  const routerQueryId = router.query.productId;

  if (!router.isReady) {
    return { isLoading: true, isError: false } as const;
  }

  if (!routerQueryId || Array.isArray(routerQueryId)) {
    return { isLoading: false, isError: true } as const;
  }
  const productId = Number(routerQueryId);
  if (Number.isNaN(productId) || !Number.isInteger(productId)) {
    return { isLoading: false, isError: true } as const;
  }
  return { productId, isLoading: false, isError: false } as const;
}
