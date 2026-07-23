import { useQueryParams } from '@modules/miscellaneous/hooks';
import { useMemo } from 'react';

const useContentId = () => {
  const [{ contentId }] = useQueryParams(['contentId']);
  const id = useMemo(() => {
    if (contentId) {
      return contentId as string;
    }
    return undefined;
  }, [contentId]);
  return id;
};

export default useContentId;
