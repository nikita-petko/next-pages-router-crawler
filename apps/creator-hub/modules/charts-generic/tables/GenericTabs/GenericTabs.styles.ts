import { makeStyles, tabClasses } from '@rbx/ui';

const useGenericTabsStyles = makeStyles()((theme) => ({
  tabRoot: {
    flex: 1,
    paddingTop: '20px',
    paddingBottom: '20px',
    [`&.${tabClasses.selected}`]: {
      background: theme.palette.surface[200],
    },
  },

  tabsIndicator: {
    top: 0,
    backgroundColor: theme.palette.actionV2.primaryBrand.fill,
  },

  tabsRoot: {
    width: '100%',
    [theme.breakpoints.up('Medium')]: {
      ...theme.border.radius.large,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      border: `1px solid ${theme.palette.components.divider}`,
    },
    [theme.breakpoints.down('Medium')]: {
      marginTop: '12px',
      marginBottom: '12px',
    },
  },
  selectedFirstTab: {
    borderTopLeftRadius: 0,
  },
  selectedLastTab: {
    borderTopRightRadius: 0,
  },
}));

export default useGenericTabsStyles;
