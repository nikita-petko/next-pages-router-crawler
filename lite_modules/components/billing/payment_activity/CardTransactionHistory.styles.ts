import { makeStyles } from '@rbx/ui';

const useCardTransactionHistoryStyles = makeStyles()((theme) => ({
  noWrap: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  paymentStatusCellContents: {
    alignItems: 'center',
    display: 'flex',
  },
  statusCircle: {
    borderRadius: '50%',
    height: '12px',
    marginRight: '8px',
    width: '12px',
  },
  statusCircleError: {
    backgroundColor: theme.palette.error.main,
  },
  statusCircleInfo: {
    backgroundColor: theme.palette.info.main,
  },
  statusCircleSuccess: {
    backgroundColor: theme.palette.success.main,
  },
}));

export default useCardTransactionHistoryStyles;
