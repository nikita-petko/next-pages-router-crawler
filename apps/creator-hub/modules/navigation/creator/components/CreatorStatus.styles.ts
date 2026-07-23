import { makeStyles, avatarClasses, selectClasses } from '@rbx/ui';

const useCreatorStatusStyles = makeStyles<{ width?: number }>()((theme, { width }) => ({
  name: {
    marginLeft: theme.spacing(1),
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  dropdownOptionColor: {
    color: theme.palette.content.standard,
    textTransform: 'none',
  },

  dropdownMenuList: { width },

  selectDropdown: {
    width: '100%',
    [`& .${avatarClasses.root}`]: {
      width: 32,
      height: 32,
    },
  },

  avatarWrapper: {
    width: 32,
    height: 32,
    margin: '12px 4px',
  },

  menuItemWrapper: {
    alignItems: 'center',
    [`.${selectClasses.select} &`]: {
      margin: '-4px 0',
    },
  },
  menuIconWrapper: {
    margin: 2,
  },
}));

export default useCreatorStatusStyles;
