import { useRouter } from 'next/router';
import { useMemo } from 'react';
import useValidateUnsubscribeRequest from './useValidateUnsubscribeRequest';

const useUnsubscribeQuery = () => {
  const router = useRouter();

  const unsubscribeParams = useMemo(() => {
    return typeof router.query.hash === 'string' &&
      router.query.hash &&
      typeof router.query.userId === 'string' &&
      router.query.userId &&
      typeof router.query.notificationType === 'string' &&
      router.query.notificationType
      ? {
          hash: router.query.hash,
          userId: router.query.userId,
          notificationType: router.query.notificationType,
        }
      : null;
  }, [router.query]);

  const { isValid, validatingRequest } = useValidateUnsubscribeRequest(
    unsubscribeParams,
    router.isReady,
  );

  return {
    unsubscribeParams,
    isValid: isValid && router.isReady && !validatingRequest,
    isLoading: !router.isReady || validatingRequest,
  };
};

export default useUnsubscribeQuery;
