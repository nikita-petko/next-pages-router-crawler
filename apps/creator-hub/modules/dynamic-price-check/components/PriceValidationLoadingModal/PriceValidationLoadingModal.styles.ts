import { makeStyles } from '@rbx/ui';

const usePriceValidationLoadingModalStyles = makeStyles()(() => ({
  loadingCircle: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '16px',
  },
}));

export default usePriceValidationLoadingModalStyles;
