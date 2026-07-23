import { makeStyles } from '@rbx/ui';

const useThumbnailImageStyles = (isFontColorDark = false) =>
  makeStyles()((theme) => ({
    imageStatusContainer: {
      backgroundColor: isFontColorDark
        ? theme.palette.surface.outline
        : theme.palette.components.input.filled.enableFill,
      color: isFontColorDark ? theme.palette.content.inverse : theme.palette.content.muted,
      width: '100%',
      height: '100%',
    },

    statusTextContainer: {
      display: 'block',
      textAlign: 'center',
      whiteSpace: 'nowrap',
      color: isFontColorDark ? theme.palette.content.inverse : theme.palette.content.muted,
    },

    imageContainer: {
      width: '100%',
      height: 0,
      paddingTop: '100%',
      position: 'relative',
      borderRadius: isFontColorDark ? 4 : 8,
      overflow: 'hidden',
      backgroundColor: theme.palette.components.input.filled.enableFill,
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

    bottomRightAdornmentContainer: {
      position: 'absolute',
      bottom: 8,
      right: 8,
      padding: 4,
      borderRadius: 4,
      background: theme.palette.surface[200],
      display: 'flex',
    },

    skeleton: {
      height: '100%',
    },
  }));

export default useThumbnailImageStyles;
