import { makeStyles } from '@rbx/ui';

const useHorizontalScrollWrapperStyles = makeStyles()((theme) => ({
  horizontalScrollContainer: {
    overflowX: 'auto',
    minWidth: '100%',
    width: 0,
  },

  horizontalScrollWrapper: {
    minWidth: theme.breakpoints.values.Large,
  },
}));
export default useHorizontalScrollWrapperStyles;
