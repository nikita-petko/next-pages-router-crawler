import { useEffect } from 'react';

import UniverseThumbnailImage from '@components/common/creative/UniverseThumbnailImage';
import { type ThumbnailStoreType, useThumbnailStore } from '@stores/thumbnailStoreProvider';

interface UniverseThumbnailProps {
  universeId: number;
}

/** 20×20 game icon for universe dropdown menu items (Figma Menu leading accessory). */
const UniverseThumbnail = ({ universeId }: UniverseThumbnailProps) => {
  const data = useThumbnailStore(
    (state: ThumbnailStoreType) => state.thumbnailsByUniverseId[universeId]?.data,
  );
  const getThumbnail = useThumbnailStore((state) => state.getThumbnail);

  useEffect(() => {
    if (!data) {
      getThumbnail(universeId);
    }
  }, [data, getThumbnail, universeId]);

  return <UniverseThumbnailImage src={data?.imageUrl} />;
};

export default UniverseThumbnail;
