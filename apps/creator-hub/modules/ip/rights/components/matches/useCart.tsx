import { instanceOfSearchContent } from '@rbx/clients/rightsV1';
import { useCallback, useMemo } from 'react';
import useInitalLocalStorage from './useInitialLocalStorage';
import Match, { MatchToJSON, MatchFromJSON } from './Match';

function getCartKey(match: Match) {
  return `${match.searchContent.contentId}${match.searchContent.contentType}`;
}

const LOCAL_STORAGE_CART_KEY = 'rightsSearchCart';
const LOCAL_STORAGE_CART_VERSION = '2';
export const MAX_CART_SIZE = 250;

function serializeCart(cart: Map<string, Match>) {
  return Array.from(cart.values()).map((val) => MatchToJSON(val));
}

function deserializeCart(item: unknown): Map<string, Match> {
  if (
    !Array.isArray(item) ||
    item.some((value) => {
      return !instanceOfSearchContent(value);
    })
  ) {
    throw new TypeError('item is not an array of search contents');
  }
  const matches = item.map((val) => MatchFromJSON(val));
  return new Map<string, Match>(matches.map((val) => [getCartKey(val), val]));
}

export function useCart(uniqueCartKey?: string) {
  // cart order is always insertion order
  const [cart, setCart] = useInitalLocalStorage<Map<string, Match>>(
    LOCAL_STORAGE_CART_KEY + (uniqueCartKey ?? ''),
    new Map<string, Match>(),
    LOCAL_STORAGE_CART_VERSION,
    deserializeCart,
    serializeCart,
  );

  const add = useCallback(
    (item: Match) => {
      setCart((prev) => {
        // shouldn't hit this, but guardrailing against going over the max.
        if (prev.size >= MAX_CART_SIZE) {
          return prev;
        }
        const newCart = new Map<string, Match>(prev);
        newCart.set(getCartKey(item), item);
        return newCart;
      });
    },
    [setCart],
  );

  const isFull = useMemo(() => {
    return cart.size >= MAX_CART_SIZE;
  }, [cart]);

  const remove = useCallback(
    (item: Match) => {
      setCart((prev) => {
        const newCart = new Map<string, Match>(prev);
        newCart.delete(getCartKey(item));
        return newCart;
      });
    },
    [setCart],
  );
  const hasItem = useCallback(
    (item: Match) => {
      return cart.has(getCartKey(item));
    },
    [cart],
  );
  const update = useCallback(
    (item: Match) => {
      setCart((prev) => {
        const newCart = new Map<string, Match>(prev);
        const isInCart = prev.has(getCartKey(item));
        if (!isInCart) {
          newCart.set(getCartKey(item), item);
        } else {
          newCart.delete(getCartKey(item));
        }
        return newCart;
      });
    },
    [setCart],
  );

  const clear = useCallback(() => {
    setCart(new Map<string, Match>());
  }, [setCart]);

  const { size } = cart;
  const items = useMemo(() => Array.from(cart.values()), [cart]);
  return { add, remove, update, clear, hasItem, items, size, isFull };
}

export default useCart;
