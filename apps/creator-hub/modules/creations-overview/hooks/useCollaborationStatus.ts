import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { UniverseCollaborationStatusResponse } from '@modules/clients/teamCreateCollaboration';
import { getUniverseCollaborationStatus } from '@modules/clients/teamCreateCollaboration';

export interface UseCollaborationStatusResult {
  response: UniverseCollaborationStatusResponse | undefined;
  isLoading: boolean;
  error: string | undefined;
}

const useCollaborationStatus = (universeId: number): UseCollaborationStatusResult => {
  const [response, setResponse] = useState<UniverseCollaborationStatusResponse | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const requestIdRef = useRef(0);

  const loadData = useCallback(async () => {
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    setIsLoading(true);
    setError(undefined);

    try {
      const apiResponse = await getUniverseCollaborationStatus(universeId);
      if (requestId !== requestIdRef.current) {
        return;
      }

      if (apiResponse.Error && apiResponse.Error !== 'None') {
        setError(apiResponse.Error);
      }

      setResponse(apiResponse);
    } catch {
      if (requestId === requestIdRef.current) {
        setError('Failed to load collaboration status.');
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [universeId]);

  useEffect(() => {
    if (universeId <= 0) {
      return;
    }
    loadData();
  }, [universeId, loadData]);

  return useMemo(() => ({ response, isLoading, error }), [response, isLoading, error]);
};

export default useCollaborationStatus;
