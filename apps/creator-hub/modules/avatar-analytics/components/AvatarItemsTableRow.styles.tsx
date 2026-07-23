import { makeStyles } from '@rbx/ui';

const useAvatarItemsTableRowStyles = makeStyles()((theme) => ({
  avatarContainer: {
    width: '40px',
    height: '40px',
    marginRight: '10px',
  },

  limitedIcon: {
    marginRight: '2px',
  },

  thumbnailBackground: {
    background: theme.palette.surface[300],
  },

  rowHoverBackground: {
    cursor: 'pointer',
    '&:hover': {
      background: theme.palette.states.hover, // constants defined based on UIBlox
    },
  },

  itemText: {
    whiteSpace: 'nowrap',
  },
}));

export default useAvatarItemsTableRowStyles;
