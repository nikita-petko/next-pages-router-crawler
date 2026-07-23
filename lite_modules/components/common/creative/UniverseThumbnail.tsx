import { useEffect } from 'react';

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

  // Foundation Avatar is always circular (`radius-circle` on root + inner wrapper).
  // Figma specifies a 20×20 rounded square for game/experience menu rows.
  return (
    <span className='inline-flex shrink-0 !size-[20px] radius-small clip bg-shift-200'>
      {data?.imageUrl ? (
        <img
          alt='universe-thumbnail'
          className='size-full object-cover object-center'
          src={data.imageUrl}
        />
      ) : null}
    </span>
  );
};

export default UniverseThumbnail;
