import { makeStyles } from '@rbx/ui';

const useActivityFeedItemStyles = makeStyles()((theme) => ({
  // General styles
  itemRow: {
    background: theme.palette.background.default,
    borderTop: '0.5px solid gray',
    '&:hover': {
      background: theme.palette.filledInputBackground,
    },
    width: '100%',
  },

  thumbnail: {
    height: '40px',
    width: '40px',
    marginRight: 15,
  },

  avatar: {
    '&:hover': {
      backgroundColor: 'DeepSkyBlue',
    },
  },

  translationStringStyles: {
    wordBreak: 'break-word',
  },

  // Small screen variant styles
  bulletSymbol: {
    flexShrink: 0,
    marginLeft: 10,
    marginRight: 10,
  },

  smallScreenTruncateUserName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  smallScreenTruncateLocation: {
    wordBreak: 'break-word',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  // Full screen variant styles
  fullScreenTruncateStyles: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'block',
  },

  truncateContainer: {
    maxWidth: '100%',
    overflow: 'hidden',
  },

  cellPadding: {
    paddingTop: '1em',
    paddingBottom: '1em',
    paddingRight: 7,
  },

  settingsLinkCell: {
    padding: 0,
    paddingRight: 10,
  },
}));

export default useActivityFeedItemStyles;
