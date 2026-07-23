import { makeStyles } from '@rbx/ui';

const useCenteredCircularProgressStyles = makeStyles()(() => ({
  centered: {
    alignItems: 'center',
    display: 'flex',
    height: '100vh',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  },
}));

export default useCenteredCircularProgressStyles;
