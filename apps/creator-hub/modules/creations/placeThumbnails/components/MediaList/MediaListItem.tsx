import React, { FC, CSSProperties, useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { DragHandleIcon, IconButton, Tooltip } from '@rbx/ui';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from '@rbx/intl';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Media, MediaType } from '../../types/Media';
import MediaListItemOptionMenuButton from './MediaListItemOptionMenuButton';
import ImagePreview from './ImagePreview';
import useMediaListStyles from './MediaList.styles';
import VideoPreview from './VideoPreview';

type MediaListItemProps = {
  item: Media;
  placeId: number;
  isActiveItem?: boolean;
  isAssetUploading: boolean;
};

const MediaListItem: FC<MediaListItemProps> = ({
  item,
  placeId,
  isActiveItem,
  isAssetUploading,
}) => {
  const { translate } = useTranslationWrapper(useTranslation());

  const { type, id: assetId } = item;
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
  } = useSortable({ id: assetId });
  const {
    classes: { listItem },
  } = useMediaListStyles();

  const style: CSSProperties = {
    opacity: isDragging ? 0.4 : undefined,
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const preview = useMemo(() => {
    switch (type) {
      case MediaType.Image:
        return <ImagePreview item={item} />;
      case MediaType.Video:
        return <VideoPreview item={item} />;
      default: {
        const exhaustiveCheck: never = type;
        throw new Error(`Unhandled media type: ${exhaustiveCheck}`);
      }
    }
  }, [item, type]);

  return (
    <li ref={setNodeRef} style={style} className={listItem}>
      {preview}
      <div>
        <MediaListItemOptionMenuButton
          mediaItem={item}
          placeId={placeId}
          isAssetUploading={isAssetUploading}
        />
        <Tooltip
          title={
            isAssetUploading
              ? translate(
                  translationKey(
                    'Label.WaitTilUploadFinishes',
                    TranslationNamespace.PlaceThumbnails,
                  ),
                )
              : undefined
          }>
          <span>
            <IconButton
              aria-label='drag-handle'
              color='inherit'
              style={{ cursor: isActiveItem ? 'grabbing' : 'grab' }}
              ref={setActivatorNodeRef}
              disabled={isAssetUploading}
              {...attributes}
              {...listeners}>
              <DragHandleIcon />
            </IconButton>
          </span>
        </Tooltip>
      </div>
    </li>
  );
};

export default MediaListItem;
