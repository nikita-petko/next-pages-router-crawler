import { makeStyles } from '@rbx/ui';

const useFiatPaidAccessStyles = makeStyles()(() => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '48px',
  },
  headingContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  bodyContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
}));

export default useFiatPaidAccessStyles;
