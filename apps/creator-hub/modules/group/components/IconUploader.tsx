import React, {
  ChangeEvent,
  Fragment,
  FunctionComponent,
  useCallback,
  useRef,
  useState,
} from 'react';
import ThumbnailImage from '@modules/miscellaneous/common/components/ThumbnailImage/ThumbnailImage';
import { useTranslation } from '@rbx/intl';
import { ThumbnailTypes } from '@rbx/thumbnails';
import {
  Button,
  EditOutlinedIcon,
  Grid,
  Typography,
  IconButton,
  makeStyles,
  ImageIcon,
  CircularProgress,
} from '@rbx/ui';
import { GroupIcon } from '../ConfigureGroupTypes';

const useIconUploaderStyles = makeStyles()((theme) => ({
  uploader: {
    position: 'relative',
  },
  imageContainer: {
    width: 132,
    height: 132,
    marginRight: 32,
    '& > div': {
      position: 'absolute',
      width: 'inherit',
      height: 'inherit',
    },
  },
  image: {
    ...theme.border.radius.large,
    position: 'absolute',
    width: 'inherit',
    height: 'inherit',
  },
  error: {
    paddingLeft: 12,
    paddingTop: 4,
  },
  inputStyle: {
    display: 'none',
  },
  editIconOnHover: {
    '&:hover': {
      opacity: 1,
    },
  },
  iconOverlay: {
    ...theme.border.radius.large,
    position: 'absolute',
    opacity: 0,
    background: theme.palette.surface[100],
    '& > button': {
      ...theme.border.radius.large,
      width: 'inherit',
      height: 'inherit',
    },
  },
  iconPlaceholder: {
    ...theme.border.radius.large,
    position: 'absolute',
    background: theme.palette.surface[100],
  },
}));

export interface IconUploaderProps {
  value: GroupIcon;
  onSelectValue: (newValue: GroupIcon) => void;
  groupId?: number;
  disabled?: boolean;
  errorMessage?: string;
}

const IconUploader: FunctionComponent<React.PropsWithChildren<IconUploaderProps>> = ({
  onSelectValue: onSelectImage,
  value,
  groupId,
  disabled = false,
  errorMessage,
}) => {
  const { translate } = useTranslation();
  const {
    classes: {
      uploader,
      imageContainer,
      image,
      error,
      inputStyle,
      iconOverlay,
      editIconOnHover,
      iconPlaceholder,
    },
    cx,
  } = useIconUploaderStyles();

  const [loading, setLoading] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClickUpload = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const acceptedFileExtensions = 'image/jpeg, image/gif, image/png, image/tga, image/bmp';

  const handleSetImage = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null;

      if (file === null) {
        return;
      }

      setLoading(true);
      const reader = new FileReader();

      reader.addEventListener('load', (e) => {
        onSelectImage({
          src: e.target?.result as string,
          file,
        });
      });

      reader.addEventListener('loadend', () => {
        setLoading(false);
      });

      reader.readAsDataURL(file);
    },
    [onSelectImage, setLoading],
  );

  return (
    <Fragment>
      <Grid container direction='row' className={uploader}>
        <Grid className={imageContainer} item>
          {loading ? (
            <Grid container className={iconPlaceholder} justifyContent='center' alignItems='center'>
              <CircularProgress color='inherit' />
            </Grid>
          ) : (
            <Fragment>
              {value?.src ? (
                <img alt='group icon' src={value?.src} className={image} />
              ) : (
                <Fragment>
                  {groupId ? (
                    <ThumbnailImage targetId={groupId} targetType={ThumbnailTypes.groupIcon} />
                  ) : (
                    <Grid
                      container
                      className={iconPlaceholder}
                      justifyContent='center'
                      alignItems='center'>
                      <ImageIcon fontSize='large' />
                    </Grid>
                  )}
                </Fragment>
              )}
            </Fragment>
          )}

          <Grid className={cx(iconOverlay, { [editIconOnHover]: !disabled })}>
            <IconButton
              aria-label={translate('Action.UploadImage')}
              size='large'
              color='inherit'
              onClick={handleClickUpload}
              disabled={disabled}>
              <EditOutlinedIcon />
            </IconButton>
          </Grid>
        </Grid>
        <Grid item>
          <Button
            data-testid='group-icon-upload'
            variant='outlined'
            size='small'
            color='primary'
            onClick={handleClickUpload}
            disabled={disabled}>
            {translate('Action.UploadImage')}
          </Button>
        </Grid>
      </Grid>
      {errorMessage && (
        <Grid className={error}>
          <Typography variant='smallLabel2' color='error'>
            {errorMessage}
          </Typography>
        </Grid>
      )}
      <input
        data-testid='file-input'
        className={inputStyle}
        accept={acceptedFileExtensions}
        ref={inputRef}
        type='file'
        onChange={handleSetImage}
      />
    </Fragment>
  );
};

export default IconUploader;
