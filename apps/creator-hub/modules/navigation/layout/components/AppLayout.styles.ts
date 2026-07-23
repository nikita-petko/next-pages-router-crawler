import { makeStyles } from '@rbx/ui';
import { topNavigationHeights, leftNavigationWidths } from './Layout.styles';

const useAppLayoutStyles = makeStyles()((theme) => ({
  root: {
    height: '100vh',
  },

  main: {
    flexGrow: 1,
    paddingBottom: 48,
  },

  leftNav: {
    position: 'fixed',
    width: `${leftNavigationWidths.large}px`,
    [theme.breakpoints.down('Medium')]: {
      width: `${leftNavigationWidths.compact}px`,
    },
    top: `${topNavigationHeights.large}px`,
    bottom: 0,
    overflowY: 'auto',
  },
}));

export default useAppLayoutStyles;
