import { makeStyles } from '@rbx/ui';

const useGridItemStyle = makeStyles<void, 'menuIcon'>()((theme, _, classes) => ({
  container: {
    position: 'relative',
    cursor: 'pointer',
    paddingBottom: 24,
    [`&:hover .${classes.menuIcon}`]: {
      visibility: 'initial',
    },
    [`&:focus-within .${classes.menuIcon}`]: {
      visibility: 'initial',
    },
  },
  menuIcon: {
    position: 'absolute',
    right: 8,
    top: 8,
    zIndex: 10,
    [theme.breakpoints.down('XLarge')]: {
      visibility: 'visible',
    },
  },
  bottomRightIcon: {
    transform: 'rotate(-45deg)',
  },
  meta: {
    width: '100%',
    marginTop: 8,
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  },
}));
export default useGridItemStyle;
