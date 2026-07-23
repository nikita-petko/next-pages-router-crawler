import type { Active, DragEndEvent, DragStartEvent, DropAnimation } from '@dnd-kit/core';
import {
  defaultDropAnimationSideEffects,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { FC } from 'react';
import React, { useState, useCallback, useMemo, memo } from 'react';
import { getCurrentPlatform, Platform } from '@rbx/core';
import type { Media } from '../../types/Media';
import useMediaListStyles from './MediaList.styles';
import MediaListItem from './MediaListItem';

const dropAnimationConfig: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.4',
      },
    },
  }),
};

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

  const [active, setActive] = useState<Active | null>(null);
  const activeItem = useMemo(
    () => mediaItems.find((item) => item.id === active?.id),
    [active?.id, mediaItems],
  );

  const platform = getCurrentPlatform();
  const isMobile = platform === Platform.iOS || platform === Platform.Android;
  const sensors = useSensors(
    useSensor(isMobile ? TouchSensor : PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const onDragStart = useCallback(({ active: activeGiven }: DragStartEvent) => {
    setActive(activeGiven);
  }, []);

  const onDragEnd = useCallback(
    ({ active: activeGiven, over }: DragEndEvent) => {
      if (over && activeGiven.id !== over?.id) {
        updateMediaItems((oldItems) => {
          const activeIndex = oldItems.findIndex(({ id: assetId }) => assetId === activeGiven.id);
          const overIndex = oldItems.findIndex(({ id: assetId }) => assetId === over.id);
          return arrayMove(oldItems, activeIndex, overIndex);
        });
      }
      setActive(null);
    },
    [updateMediaItems],
  );
  const onDragCancel = useCallback(() => {
    setActive(null);
  }, []);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}>
      <SortableContext items={mediaItems} disabled={isAssetUploading}>
        <ul className={mediaListContainer}>
          {mediaItems.map((item) => (
            <MediaListItem
              key={item.id}
              item={item}
              placeId={placeId}
              isAssetUploading={isAssetUploading}
            />
          ))}
        </ul>
      </SortableContext>
      <DragOverlay dropAnimation={dropAnimationConfig}>
        {activeItem ? (
          <MediaListItem
            item={activeItem}
            placeId={placeId}
            isActiveItem
            isAssetUploading={isAssetUploading}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default memo(MediaList);
