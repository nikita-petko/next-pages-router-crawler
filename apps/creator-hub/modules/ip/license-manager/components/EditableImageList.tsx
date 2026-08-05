import { useMemo } from 'react';
import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers';
import { closestCenter } from '@dnd-kit/collision';
import { PointerActivationConstraints } from '@dnd-kit/dom';
import type { DragEndEvent } from '@dnd-kit/react';
import { DragDropProvider, KeyboardSensor, PointerSensor } from '@dnd-kit/react';
import { isSortableOperation, useSortable } from '@dnd-kit/react/sortable';
import { useTranslation } from '@rbx/intl';
import { AssetThumbnailSize, ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { IconButton, makeStyles, DeleteOutlinedIcon, DragHandleIcon } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { ImageAsset } from '../../utils/uploadImageAssetsIfNeeded';

const useStyles = makeStyles<void, 'actions'>()((theme, _, classes) => ({
  thumbnailWrapper: {
    flexShrink: 0,
    margin: 8,
  },
  thumbnailContainer: {
    width: 100,
    aspectRatio: '16/9',
    display: 'block',
    padding: 0,
  },
  thumbnail: {
    ...theme.border.radius.xsmall,
    objectFit: 'cover',
  },
  imagePreview: {
    ...theme.border.radius.xsmall,
    width: 100,
    aspectRatio: '16/9',
    objectFit: 'cover',
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: `1px solid ${theme.palette.components.divider}`,
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: theme.palette.components.input.filled.hoverFill,
    },
    // we hide the action buttons on devices that supports hover
    // otherwise the buttons are always visible
    '@media (hover: hover)': {
      [`&:not(:hover) .${classes.actions}`]: {
        opacity: 0,
      },
    },
  },

  content: {
    flex: 1,
    minWidth: 0,
  },
  actions: {
    flexShrink: 0,
    display: 'flex',
    // we want the drag handle area to stretch from top to bottom
    // to provider better UX, so we'll have more complicated styles here
    // and in drag handle
    alignSelf: 'stretch',
    alignItems: 'center',
    transition: 'opacity 0.2s',
  },
  dragHandle: {
    cursor: 'grab',
    touchAction: 'none',
    paddingRight: 8,
    alignSelf: 'stretch',
    display: 'flex',
    alignItems: 'center',
    '&:active': {
      cursor: 'grabbing',
    },
  },
  deleteButton: {
    marginRight: 8,
  },
}));

const DRAG_ACTIVATION_DISTANCE_PX = 5;
const VERTICAL_SORTABLE_MODIFIERS = [RestrictToVerticalAxis];
const IMAGE_LIST_SENSORS = [
  PointerSensor.configure({
    activationConstraints: [
      new PointerActivationConstraints.Distance({ value: DRAG_ACTIVATION_DISTANCE_PX }),
    ],
  }),
  KeyboardSensor,
];

/**
 * A preview of an image we have not uploaded (e.g. it is not an asset yet)
 */
const ImageBeforeUploadPreview = ({ file }: { file: File }) => {
  const { classes } = useStyles();
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());

  const clientOnlyAssetUrl = useMemo(() => URL.createObjectURL(file), [file]);
  const previewAlt = tPendingTranslation(
    'Image preview',
    'Alternative text for an image selected for upload before it has been uploaded.',
    translationKey('Label.ImagePreview', TranslationNamespace.AgreementsManager),
  );

  return <img className={classes.imagePreview} src={clientOnlyAssetUrl} alt={previewAlt} />;
};

type ThumbnailItem = ImageAsset & {
  id: string;
};

interface ThumbnailListProps {
  thumbnails: ThumbnailItem[];
  onReorder: (sourceIndex: number, destinationIndex: number) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Draggable image item.
 */
const SortableImageItem = ({
  item,
  index,
  onRemove,
  disabled,
  showDragHandle,
}: {
  item: ThumbnailItem;
  index: number;
  onRemove: (index: number) => void;
  disabled?: boolean;
  showDragHandle?: boolean;
}) => {
  const { classes } = useStyles();
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { handleRef, isDragging, ref } = useSortable({
    id: item.id,
    index,
    disabled: disabled === true || !showDragHandle,
    collisionDetector: closestCenter,
    modifiers: VERTICAL_SORTABLE_MODIFIERS,
  });

  const style = {
    opacity: isDragging ? 0.5 : 1,
  };
  const thumbnailAlt = tPendingTranslation(
    'Thumbnail',
    'Section heading used for inform the user that this section is about thumbnails (eg. experience thumbnails or listing thumbnails)',
    translationKey('Label.Thumbnail', TranslationNamespace.AgreementsManager),
  );
  const deleteThumbnailLabel = tPendingTranslation(
    'Delete thumbnail',
    'ARIA label for the action that removes a license-listing thumbnail.',
    translationKey('Action.DeleteThumbnail', TranslationNamespace.AgreementsManager),
  );

  return (
    <div ref={ref} style={style} className={classes.listItem}>
      <div className={classes.thumbnailWrapper}>
        {item.type === 'existing' && (
          <Thumbnail2d
            targetId={item.assetId}
            type={ThumbnailTypes.assetThumbnail}
            alt={thumbnailAlt}
            returnPolicy={ReturnPolicy.PlaceHolder}
            includeBackground={false}
            // eslint-disable-next-line no-underscore-dangle -- external enum
            size={AssetThumbnailSize._768x432}
            containerClass={classes.thumbnailContainer}
            imgClassName={classes.thumbnail}
          />
        )}
        {item.type === 'new' && <ImageBeforeUploadPreview file={item.file} />}
      </div>

      <div className={classes.actions}>
        <IconButton
          className={classes.deleteButton}
          aria-label={deleteThumbnailLabel}
          color='secondary'
          disabled={disabled}
          onClick={() => onRemove(index)}
          size='small'>
          <DeleteOutlinedIcon />
        </IconButton>
        {showDragHandle && (
          <div ref={handleRef} className={classes.dragHandle} data-testid='drag-handle'>
            <DragHandleIcon color='action' />
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * A list of images. The images can be either
 * - existing image assets (which will will render through the Thumbnail2d component)
 * - new images, that are not yet uploaded.
 *
 * The component allows for re-ordering (via drag/drop) and removing images.
 */
const EditableImageList = ({
  thumbnails,
  onReorder,
  onRemove,
  disabled = false,
  className,
}: ThumbnailListProps) => {
  const handleDragEnd = (event: DragEndEvent) => {
    if (!event.canceled && event.operation.source && isSortableOperation(event.operation)) {
      const { initialIndex, index } = event.operation.source;
      if (initialIndex !== index) {
        onReorder(initialIndex, index);
      }
    }
  };

  if (thumbnails.length === 0) {
    return <div className={className} />;
  }

  return (
    <div className={className}>
      <DragDropProvider sensors={IMAGE_LIST_SENSORS} onDragEnd={handleDragEnd}>
        {thumbnails.map((thumbnail, index) => (
          <SortableImageItem
            key={thumbnail.id}
            item={thumbnail}
            index={index}
            onRemove={onRemove}
            disabled={disabled}
            showDragHandle={thumbnails.length > 1}
          />
        ))}
      </DragDropProvider>
    </div>
  );
};

export default EditableImageList;
