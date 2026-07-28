import { makeStyles } from '@rbx/ui';

const useProgressCircleStyles = makeStyles()((theme) => ({
  root: {
    background: theme.palette.background.default,
    borderRadius: '50%',
    marginRight: 16,
    position: 'relative',
  },

  circle: {
    display: 'block',
  },

  textContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

export default useProgressCircleStyles;
