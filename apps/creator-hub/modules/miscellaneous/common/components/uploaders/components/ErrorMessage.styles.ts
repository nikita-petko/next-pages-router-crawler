import { makeStyles } from '@rbx/ui';

const useErrorMessageStyles = makeStyles()(() => ({
  errorStyle: {
    // these are customized numbers
    boxSizing: 'border-box',
    paddingTop: '2px',
    paddingBottom: '5px',
    minHeight: '24px',
  },
  errorAlertStyle: {
    marginTop: '10px',
  },
}));

export default useErrorMessageStyles;
