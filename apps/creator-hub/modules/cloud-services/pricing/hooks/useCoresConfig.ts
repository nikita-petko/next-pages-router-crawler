import { useCallback, useEffect, useState } from 'react';
import { getExtendedServicesCoresPlaceIds } from '@modules/clients/creatorConfigsPublicApi';

export type UseCoresConfigResult = {
  placeIds: number[];
  reload: () => Promise<void>;
};

export function useCoresConfig(universeId: number | undefined): UseCoresConfigResult {
  const [placeIds, setPlaceIds] = useState<number[]>([]);

  const reload = useCallback(async () => {
    if (typeof universeId !== 'number') {
      setPlaceIds([]);
      return;
    }
    try {
      const ids = await getExtendedServicesCoresPlaceIds(String(universeId));
      setPlaceIds(ids);
    } catch {
      setPlaceIds([]);
    }
  }, [universeId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { placeIds, reload };
}
