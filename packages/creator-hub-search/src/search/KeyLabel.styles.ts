import { makeStyles } from '@rbx/ui';

const useKeyLabelStyles = makeStyles()(() => ({
  container: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    height: 20,
  },
  key: {
    '&&': {
      height: 20,
      padding: '0 4px',
      pointerEvents: 'none',
    },
  },
}));

export default useKeyLabelStyles;
