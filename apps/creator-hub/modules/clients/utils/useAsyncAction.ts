import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseAsyncActionState<T> {
  isLoading: boolean;
  hasError: boolean;
  data: T | undefined;
  refetch: () => Promise<void>;
}

const useAsyncAction = <T>(action: () => Promise<T>): UseAsyncActionState<T> => {
  const isMounted = useRef(true);

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [data, setData] = useState<T>();

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      const response = await action();
      if (isMounted.current) {
        setHasError(false);
        setData(response);
      }
    } catch {
      if (isMounted.current) {
        setHasError(true);
      }
    }
    if (isMounted.current) {
      setIsLoading(false);
    }
  }, [action]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { isLoading, hasError, data, refetch: fetch };
};

export default useAsyncAction;
