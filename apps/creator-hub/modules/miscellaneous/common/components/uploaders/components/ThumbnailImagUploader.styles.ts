import { makeStyles } from '@rbx/ui';

const useThumbnailImagUploaderStyles = makeStyles()((theme) => ({
  imageStatusContainer: {
    backgroundColor: theme.palette.filledInputBackground,
    width: '100%',
    height: '100%',
  },

  statusTextContainer: {
    display: 'block',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    color: theme.palette.text.secondary,
  },

  errorMessageText: {
    color: theme.palette.error.main,
  },
}));

export default useThumbnailImagUploaderStyles;
