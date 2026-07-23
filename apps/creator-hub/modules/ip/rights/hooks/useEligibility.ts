import { useState, useEffect } from 'react';
import type { AuthorizationStatus } from '@rbx/client-rights/v1';
import rightsClient from '@modules/clients/rights';
import { getResponseFromError } from '@modules/clients/utils';
import ErrorType from '../enums/ErrorType';

export default function useEligibility() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(ErrorType.None);
  const [auth, setAuth] = useState<AuthorizationStatus | undefined>(undefined);

  useEffect(() => {
    const performFetch = async () => {
      try {
        const response = await rightsClient.getEligibility();
        setAuth(response);
      } catch (e) {
        const response = getResponseFromError(e);

        if (!response || response.status < 400) {
          setError(ErrorType.None);
        } else if (response.status >= 500) {
          setError(ErrorType.ServerError);
        } else if (response.status === 401 || response.status === 403) {
          setError(ErrorType.AuthError);
        } else if (response.status === 404) {
          setError(ErrorType.NotFound);
        } else {
          setError(ErrorType.RequestError);
        }
      }
      setIsLoading(false);
    };
    setIsLoading(true);
    performFetch();
  }, []);

  return { isLoading, error, auth };
}
