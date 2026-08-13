import { makeStyles } from '@rbx/ui';

const useGenericTabsStyles = makeStyles()((theme) => ({
  tabsRoot: {
    [theme.breakpoints.down('Medium')]: {
      marginTop: '12px',
      marginBottom: '12px',
    },
  },
}));

export default useGenericTabsStyles;
