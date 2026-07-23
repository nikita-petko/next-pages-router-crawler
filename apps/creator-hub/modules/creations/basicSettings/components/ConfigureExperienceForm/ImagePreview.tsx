import React, { FC, useState, useCallback, memo } from 'react';
import { EditOutlinedIcon, Fade, IconButton, Link, makeStyles } from '@rbx/ui';
import { getCurrentPlatform, Platform } from '@rbx/core';

const useStyles = makeStyles()((theme) => ({
  image: {
    ...theme.border.radius.large,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'contain',
    backgroundColor: theme.palette.surface[400],
    position: 'relative',
  },
  editButton: {
    position: 'absolute',
    right: '8px',
    top: '8px',
  },
}));

type ImagePreviewProps = {
  linkTo: string;
  imageUrl?: string;
  className?: string;
};

const ImagePreview: FC<ImagePreviewProps> = ({ imageUrl, linkTo, className }) => {
  const {
    classes: { editButton, image },
    cx,
  } = useStyles();

  const currentPlatform = getCurrentPlatform();
  const isMobile = currentPlatform === Platform.Android || currentPlatform === Platform.iOS;

  const [hover, setHover] = useState(false);
  const onMouseEnter = useCallback(() => {
    setHover(true);
  }, []);
  const onMouseLeave = useCallback(() => {
    setHover(false);
  }, []);

  const showEditButton = isMobile || hover;
  return (
    <div
      style={{ backgroundImage: `url(${imageUrl})` }}
      className={cx(image, className)}
      role='img'
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}>
      <Fade in={showEditButton}>
        <Link href={linkTo} data-testid='go-to-setting'>
          <IconButton
            aria-label='edit'
            variant='contained'
            color='onMediaLight'
            size='small'
            classes={{ root: editButton }}>
            <EditOutlinedIcon />
          </IconButton>
        </Link>
      </Fade>
    </div>
  );
};

export default memo(ImagePreview);
