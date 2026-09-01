import type { FC } from 'react';
import React, { useCallback, memo } from 'react';
import { move } from '@dnd-kit/helpers';
import type { DragEndEvent } from '@dnd-kit/react';
import { DragDropProvider } from '@dnd-kit/react';
import type { Media } from '../../types/Media';
import useMediaListStyles from './MediaList.styles';
import MediaListItem from './MediaListItem';

type MediaListProps = {
  mediaItems: Media[];
  updateMediaItems: React.Dispatch<React.SetStateAction<Media[]>>;
  placeId: number;
  isAssetUploading: boolean;
};

const MediaList: FC<MediaListProps> = ({
  mediaItems,
  updateMediaItems,
  placeId,
  isAssetUploading,
}) => {
  const {
    classes: { mediaListContainer },
  } = useMediaListStyles();

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (!event.canceled) {
        updateMediaItems((oldItems) => move(oldItems, event));
      }
    },
    [updateMediaItems],
  );

  return (
    <DragDropProvider onDragEnd={onDragEnd}>
      <ul className={mediaListContainer}>
        {mediaItems.map((item, index) => (
          <MediaListItem
            key={item.id}
            item={item}
            index={index}
            placeId={placeId}
            isAssetUploading={isAssetUploading}
          />
        ))}
      </ul>
    </DragDropProvider>
  );
};

export default memo(MediaList);
