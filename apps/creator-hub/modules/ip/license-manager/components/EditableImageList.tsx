import type { DragEndEvent, Modifier } from '@dnd-kit/core';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMemo } from 'react';
import { AssetThumbnailSize, ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { IconButton, makeStyles, DeleteOutlinedIcon, DragHandleIcon } from '@rbx/ui';
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

/**
 * Can only be dragged up/down e.g. vertical.
 */
const verticalLockModifier: Modifier = ({ transform }) => {
  return {
    ...transform,
    x: 0,
  };
};

/**
 * A preview of an image we have not uploaded (e.g. it is not an asset yet)
 */
const ImageBeforeUploadPreview = ({ file }: { file: File }) => {
  const { classes } = useStyles();

  const clientOnlyAssetUrl = useMemo(() => {
    if (file) {
      return URL.createObjectURL(file);
    }
    return;
  }, [file]);

  return <img className={classes.imagePreview} src={clientOnlyAssetUrl} alt='preview' />;
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={classes.listItem}>
      <div className={classes.thumbnailWrapper}>
        {item.type === 'existing' && (
          <Thumbnail2d
            targetId={item.assetId}
            type={ThumbnailTypes.assetThumbnail}
            alt='Thumbnail'
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
          aria-label='Delete thumbnail'
          color='secondary'
          disabled={disabled}
          onClick={() => onRemove(index)}
          size='small'>
          <DeleteOutlinedIcon />
        </IconButton>
        {showDragHandle && (
          <div
            className={classes.dragHandle}
            {...attributes}
            {...listeners}
            data-testid='drag-handle'>
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
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = thumbnails.findIndex((item) => item.id === active.id);
      const newIndex = thumbnails.findIndex((item) => item.id === over.id);

      onReorder(oldIndex, newIndex);
    }
  };

  if (thumbnails.length === 0) {
    return <div className={className} />;
  }

  return (
    <div className={className}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[verticalLockModifier]}>
        <SortableContext
          items={thumbnails.map((item) => item.id)}
          strategy={verticalListSortingStrategy}>
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
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default EditableImageList;
