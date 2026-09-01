import { useMemo } from 'react';
import { useQueryParams } from '@modules/miscellaneous/hooks';

const useUniverseId = () => {
  const [{ id }] = useQueryParams(['id']);
  const universeId = useMemo(() => {
    if (id) {
      const parsedId = parseInt(id as string, 10);
      if (parsedId > 0) {
        return parsedId;
      }
    }
    return;
  }, [id]);
  return universeId;
};

export default useUniverseId;
