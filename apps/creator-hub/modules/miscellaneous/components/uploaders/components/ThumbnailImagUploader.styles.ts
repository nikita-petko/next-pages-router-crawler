import { makeStyles } from '@rbx/ui';

const useThumbnailImagUploaderStyles = makeStyles()((theme) => ({
  imageStatusContainer: {
    // oxlint-disable-next-line typescript/no-deprecated -- legacy palette retained during barrel-import migration
    backgroundColor: theme.palette.filledInputBackground,
    width: '100%',
    height: '100%',
  },

  statusTextContainer: {
    display: 'block',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    // oxlint-disable-next-line typescript/no-deprecated -- legacy palette retained during barrel-import migration
    color: theme.palette.text.secondary,
  },

  errorMessageText: {
    // oxlint-disable-next-line typescript/no-deprecated -- legacy palette retained during barrel-import migration
    color: theme.palette.error.main,
  },

  defaultToAutogenThumbnailOnSaveNotice: {
    alignItems: 'flex-start',
    display: 'inline-flex',
    gap: 4,
    '& svg': {
      flexShrink: 0,
      marginTop: 2,
    },
  },
}));

export default useThumbnailImagUploaderStyles;
