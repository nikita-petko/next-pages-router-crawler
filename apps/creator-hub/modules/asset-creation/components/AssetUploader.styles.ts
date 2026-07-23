import { makeStyles } from '@rbx/ui';

const useAssetUploaderStyles = makeStyles()((theme) => ({
  errorMessageText: {
    color: theme.palette.error.main,
  },

  uploaderContainer: {
    columnGap: '16px',
  },

  imageContainer: {
    width: '100%',
    height: 0,
    paddingTop: '100%',
    position: 'relative',
    borderRadius: '10px',
    overflow: 'hidden',
    backgroundColor: theme.palette.filledInputBackground,
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
    backgroundColor: theme.palette.filledInputBackground,
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

  fileUploadInfoContainer: {
    padding: '4px 12px',
  },
}));

export default useAssetUploaderStyles;
