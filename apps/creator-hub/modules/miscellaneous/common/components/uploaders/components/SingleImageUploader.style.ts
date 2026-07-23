import { makeStyles } from '@rbx/ui';

const useSingleImageUploadStyles = makeStyles()((theme) => ({
  uploaderContainer: {
    columnGap: '16px',
  },

  imageContainer: {
    width: '100%',
    height: 0,
    paddingTop: '100%',
    position: 'relative',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: theme.palette.components.input.filled.enableFill,
  },

  imageGrid: {
    minWidth: 120,
    maxWidth: 120,
    [theme.breakpoints.up('Medium')]: {
      maxWidth: 512,
    },
  },

  fileInputGrid: {
    flexShrink: 1,
  },

  imageWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
    textAlign: 'center',
  },

  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    left: '0',
    bottom: '0',
    objectFit: 'contain',
  },

  icon: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.palette.components.input.filled.enableFill,
  },

  iconSize: {
    fontSize: '50px',
  },

  uploadButton: {
    display: 'inline-block',
  },

  removeButton: {
    marginLeft: '4px',
  },

  imageUploadInfoContainer: {
    padding: '8px 4px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },

  imagePlaceHolder: {},
  imageStatusBar: {},
  buttonContainer: {},
  button: {},
}));

export default useSingleImageUploadStyles;
