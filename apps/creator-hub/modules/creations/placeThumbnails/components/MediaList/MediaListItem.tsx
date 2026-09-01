import type { FC, CSSProperties } from 'react';
import { useMemo } from 'react';
import { useSortable } from '@dnd-kit/react/sortable';
import { useTranslation } from '@rbx/intl';
import { DragHandleIcon, IconButton, Tooltip } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { Media } from '../../types/Media';
import { MediaType } from '../../types/Media';
import ImagePreview from './ImagePreview';
import useMediaListStyles from './MediaList.styles';
import MediaListItemOptionMenuButton from './MediaListItemOptionMenuButton';
import VideoPreview from './VideoPreview';

type MediaListItemProps = {
  item: Media;
  index: number;
  placeId: number;
  isAssetUploading: boolean;
};

const MediaListItem: FC<MediaListItemProps> = ({ item, index, placeId, isAssetUploading }) => {
  const { translate } = useTranslationWrapper(useTranslation());

  const { type, id: assetId } = item;
  const { handleRef, isDragging, ref } = useSortable({
    id: assetId,
    index,
    disabled: isAssetUploading,
  });
  const {
    classes: { listItem },
  } = useMediaListStyles();

  const style: CSSProperties = {
    opacity: isDragging ? 0.4 : undefined,
  };

  const preview = useMemo(() => {
    switch (type) {
      case MediaType.Image:
        return <ImagePreview item={item} />;
      case MediaType.Video:
        return <VideoPreview item={item} />;
      default: {
        const exhaustiveCheck: never = type;
        throw new Error(`Unhandled media type: ${String(exhaustiveCheck)}`);
      }
    }
  }, [item, type]);

  return (
    <li ref={ref} style={style} className={listItem}>
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
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              ref={handleRef}
              disabled={isAssetUploading}>
              <DragHandleIcon />
            </IconButton>
          </span>
        </Tooltip>
      </div>
    </li>
  );
};

export default MediaListItem;
