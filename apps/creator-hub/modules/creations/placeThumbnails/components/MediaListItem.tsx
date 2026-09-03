import { Draggable } from '@hello-pangea/dnd';
import type { Dispatch, FunctionComponent, SetStateAction, MouseEvent } from 'react';
import React, { useCallback, useMemo } from 'react';
import { ThumbnailTypes } from '@rbx/thumbnails';
import {
  ListItemAvatar,
  DeleteOutlinedIcon,
  IconButton,
  Grid,
  DragHandleIcon,
  ListItemButton,
} from '@rbx/ui';
import useThumbnailImage from '@modules/miscellaneous/components/ThumbnailImage/useThumbnailImage';
import type { Thumbnail } from '../types';
import { MediaType } from '../types';
import useMediaListItemStyles from './MediaListItem.styles';

export interface ThumbnailStateProps {
  index: number;
  thumbnailInfo: Thumbnail;
  selectedThumbnailId?: number;
  openDialog: () => void;
  isReordering: boolean;
  setThumbnailIdForDeletion: Dispatch<SetStateAction<number | null>>;
  setThumbnailAssetIdForDeletion?: Dispatch<SetStateAction<number | null>>;
  onSelectItem: (thumbnail: Thumbnail) => void;
}

const MediaListItem: FunctionComponent<React.PropsWithChildren<ThumbnailStateProps>> = ({
  index,
  thumbnailInfo,
  selectedThumbnailId,
  openDialog,
  setThumbnailIdForDeletion,
  setThumbnailAssetIdForDeletion,
  isReordering,
  onSelectItem,
}) => {
  const videoThumbnailUrl = `https://img.youtube.com/vi/${thumbnailInfo.videoHash}/0.jpg`;
  const { thumbnailImage } = useThumbnailImage({
    targetId: thumbnailInfo.imageId,
    targetType: ThumbnailTypes.assetThumbnail,
    fontColor: 'dark',
  });
  const {
    classes: { imageContainer, image, avatar },
  } = useMediaListItemStyles();

  const videoThumbnail = useMemo(() => {
    if (thumbnailInfo.type !== MediaType.Video) {
      return null;
    }
    return (
      <Grid item container XSmall={12} justifyContent='center' alignItems='center'>
        <div className={imageContainer}>
          <img className={image} src={videoThumbnailUrl} alt='' />
        </div>
      </Grid>
    );
  }, [image, imageContainer, thumbnailInfo.type, videoThumbnailUrl]);

  const handleClickDelete = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault(); // avoid also selecting the list item
      event.stopPropagation();
      setThumbnailIdForDeletion(thumbnailInfo.thumbnailId);
      if (setThumbnailAssetIdForDeletion) {
        setThumbnailAssetIdForDeletion(thumbnailInfo.assetId);
      }
      openDialog();
    },
    [openDialog, setThumbnailIdForDeletion, setThumbnailAssetIdForDeletion, thumbnailInfo],
  );

  const handleDragHandle = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  return (
    <Draggable
      draggableId={thumbnailInfo.thumbnailId.toString()}
      key={thumbnailInfo.thumbnailId.toString()}
      index={index}>
      {(provided) => (
        <ListItemButton
          onClick={() => onSelectItem(thumbnailInfo)}
          disabled={isReordering}
          selected={thumbnailInfo.thumbnailId === selectedThumbnailId}
          ref={provided.innerRef}
          {...provided.draggableProps}>
          <Grid container justifyContent='space-between'>
            <Grid item>
              <ListItemAvatar className={avatar}>
                {videoThumbnail !== null ? videoThumbnail : thumbnailImage}
              </ListItemAvatar>
            </Grid>
            <Grid item>
              <IconButton
                data-testid={`delete-thumbnail-${index}`}
                edge='end'
                aria-label='delete'
                onClick={handleClickDelete}
                size='large'>
                <DeleteOutlinedIcon color='secondary' />
              </IconButton>
              <IconButton
                data-testid={`drag-handle-${index}`}
                edge='end'
                aria-label='drag-handle'
                disableFocusRipple
                disableRipple
                disableTouchRipple
                onClick={handleDragHandle}
                color='secondary'
                {...provided.dragHandleProps}
                size='large'>
                <DragHandleIcon />
              </IconButton>
            </Grid>
          </Grid>
        </ListItemButton>
      )}
    </Draggable>
  );
};

export default MediaListItem;
