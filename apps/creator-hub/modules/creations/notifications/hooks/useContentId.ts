import { useMemo } from 'react';
import { useQueryParams } from '@modules/miscellaneous/hooks';

const useContentId = () => {
  const [{ contentId }] = useQueryParams(['contentId']);
  const id = useMemo(() => {
    if (contentId) {
      return contentId as string;
    }
    return;
  }, [contentId]);
  return id;
};

export default useContentId;
