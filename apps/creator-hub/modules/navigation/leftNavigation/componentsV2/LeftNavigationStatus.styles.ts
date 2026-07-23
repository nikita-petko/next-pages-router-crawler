import { makeStyles } from '@rbx/ui';

const useLeftNavigationStatusStyles = makeStyles()(() => ({
  fullWidth: {
    width: '100%',
  },
  overflowText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  listItemAvatar: {
    minWidth: '44px',
  },

  avatar: {
    width: '32px',
    height: '32px',
  },
}));

export default useLeftNavigationStatusStyles;
