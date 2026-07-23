import { useQueryParams } from '@modules/miscellaneous/hooks';
import { useMemo } from 'react';

const useUniverseId = () => {
  const [{ id }] = useQueryParams(['id']);
  const universeId = useMemo(() => {
    if (id) {
      const parsedId = parseInt(id as string, 10);
      if (parsedId > 0) {
        return parsedId;
      }
    }
    return undefined;
  }, [id]);
  return universeId;
};

export default useUniverseId;
