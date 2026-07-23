import { makeStyles } from '@rbx/ui';

const useBasicLayoutStyles = makeStyles()(() => ({
  root: {
    height: '100vh',
  },

  main: {
    width: '100%',
    height: '100%',
    overflow: 'scroll',
  },

  content: {
    flex: 1,
    maxWidth: '1920px',
  },

  footer: {
    flex: 0,
  },
}));

export default useBasicLayoutStyles;
