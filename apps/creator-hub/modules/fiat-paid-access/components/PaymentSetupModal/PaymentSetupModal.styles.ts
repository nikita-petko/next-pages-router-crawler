import { makeStyles } from '@rbx/ui';

const usePaymentSetupModalStyles = makeStyles()((theme) => ({
  grid: {
    marginTop: '15px',
    gap: '16px',
  },
  gridItem: {
    width: '100%',
  },
  errorMsg: {
    width: '100%',
    marginTop: 16,
    paddingLeft: 8,
    paddingRight: 8,
    color: theme.palette.actionV2.important.fill,
    fontWeight: 'bold',
    fontSize: 12,
  },
}));

export default usePaymentSetupModalStyles;
