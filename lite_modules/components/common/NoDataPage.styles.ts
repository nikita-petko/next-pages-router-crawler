import { makeStyles } from '@rbx/ui';

const useNoDataPageStyles = makeStyles()(() => ({
  centered: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
    position: 'relative',
    top: '50%',
    width: '100%',
  },
}));

export default useNoDataPageStyles;
