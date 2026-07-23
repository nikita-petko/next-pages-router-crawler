import { makeStyles, iconButtonClasses } from '@rbx/ui';

const useLeftNavigationListStyles = makeStyles()((theme) => ({
  sidebarLink: {
    fontWeight: 'inherit',
    color: theme.palette.actionV2.primary.fill,
    '&:hover': {
      textDecoration: 'none',
    },
  },
  listItemAdornment: {
    display: 'flex',
  },
  listItemIcon: {
    minWidth: 40,
  },
  listSubheader: {
    backgroundColor: 'transparent',
    paddingTop: 8,
    paddingBottom: 8,
  },
  iconOnlyList: {
    paddingTop: 20,
  },
  iconOnlyItem: {
    paddingBottom: 8,
  },
  iconOnlyItemSelected: {
    [`& .${iconButtonClasses.root}`]: {
      backgroundColor: theme.palette.states.selected,
    },
  },
}));

export default useLeftNavigationListStyles;
