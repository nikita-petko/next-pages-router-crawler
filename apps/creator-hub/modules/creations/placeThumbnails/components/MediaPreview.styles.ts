import { makeStyles } from '@rbx/ui';

const useMediaPreviewStyles = makeStyles()((theme) => ({
  previewContainer: {
    aspectRatio: '16 / 9',
    borderRadius: 8,
    overflow: 'hidden',
  },

  previewContents: {
    height: '100%',
    width: '100%',
    objectFit: 'contain',
    backgroundColor: theme.palette.filledInputBackground,
  },

  errorContents: {
    height: '100%',
    width: '100%',
    objectFit: 'contain',
    backgroundColor: theme.palette.filledInputBackground,
  },
}));

export default useMediaPreviewStyles;
