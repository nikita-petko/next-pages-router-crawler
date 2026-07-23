import React, { forwardRef, Ref } from 'react';
import {
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  DeleteOutlinedIcon,
  IconButton,
  ListItemButton,
} from '@rbx/ui';
import usePreviewListItemStyles from './PreviewListItem.styles';
import { ImageDescription } from '../types';

export interface PreviewProps {
  image: ImageDescription;
  onRemove: () => void;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
}

function PreviewListItem(props: PreviewProps, ref: Ref<HTMLDivElement>) {
  const { image, onRemove, onClick, selected, ...otherProps } = props;
  const {
    classes: { imageStyle, listItemStyle },
  } = usePreviewListItemStyles();
  return image.url ? (
    <div {...otherProps} ref={ref}>
      <ListItemButton className={listItemStyle} selected={selected} onClick={onClick}>
        <ListItemIcon>
          <img className={imageStyle} src={image.url} alt={image.altText} />
        </ListItemIcon>
        <ListItemText primary={image.name} secondary={image.statusText || ' '} />
        <ListItemSecondaryAction>
          <IconButton aria-label='delete' color='secondary' onClick={onRemove} size='large'>
            <DeleteOutlinedIcon />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItemButton>
    </div>
  ) : null;
}

const PreviewListItemWithRef = forwardRef(PreviewListItem);

export default PreviewListItemWithRef;
