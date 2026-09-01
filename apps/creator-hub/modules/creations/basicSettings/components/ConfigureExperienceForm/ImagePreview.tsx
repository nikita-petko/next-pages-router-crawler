import type { FC } from 'react';
import { memo } from 'react';
import { EditOutlinedIcon, IconButton, Link, makeStyles } from '@rbx/ui';

const useStyles = makeStyles<void, 'editButton'>()((theme, _, classes) => ({
  image: {
    ...theme.border.radius.large,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'contain',
    backgroundColor: theme.palette.surface[400],
    position: 'relative',
    '@media (hover: hover)': {
      [`&:not(:hover):not(:focus-within) .${classes.editButton}`]: {
        opacity: 0,
      },
    },
  },
  editButton: {
    position: 'absolute',
    right: '8px',
    top: '8px',
    transition: 'opacity 0.2s',
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

  return (
    <div style={{ backgroundImage: `url(${imageUrl})` }} className={cx(image, className)}>
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
    </div>
  );
};

export default memo(ImagePreview);
