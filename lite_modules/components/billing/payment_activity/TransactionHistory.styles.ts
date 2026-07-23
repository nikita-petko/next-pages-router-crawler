import { makeStyles } from '@rbx/ui';

import { marginUnit, paddingUnit } from '@constants/styleConstants';

const useTransactionHistoryStyles = makeStyles()((theme) => ({
  adCreditActivityCell: {
    display: 'flex',
    fontWeight: 300,
    height: paddingUnit * 9,
    padding: paddingUnit * 2,
  },
  adCreditActivityHoverContainer: {
    padding: paddingUnit,
  },
  amountChargedCell: {
    fontWeight: 300,
    padding: paddingUnit * 2,
    textAlign: 'right',
  },

  amountChargedCellHeader: {
    fontWeight: 350,
    padding: paddingUnit * 2,
    textAlign: 'right',
  },

  failedToGetTransactionsContainer: {
    background: theme.palette.surface[200],
    color: theme.palette.actionV2.important.fill,
    display: 'left',
    paddingBottom: paddingUnit * 4,
    paddingLeft: paddingUnit * 3,
    paddingRight: paddingUnit * 3,
    paddingTop: paddingUnit * 4,
  },

  failedtoLoadMoreTransactionsContainer: {
    background: theme.palette.surface[200],
    color: theme.palette.actionV2.important.fill,
    display: 'flex',
    justifyContent: 'center',
    paddingTop: paddingUnit * 3,
  },

  failedToLoadMoreTransactionsIcon: {
    marginRight: marginUnit * 0.5,
  },

  failedToLoadTransactionsIcon: {
    float: 'left',
    marginRight: marginUnit * 0.5,
  },

  footerContainer: {
    marginTop: marginUnit * 3,
    textAlign: 'center',
  },

  noTransactionHistoryContainer: {
    background: theme.palette.surface[200],
    paddingBottom: paddingUnit * 4,
    paddingLeft: paddingUnit * 3,
    paddingRight: paddingUnit * 3,
    paddingTop: paddingUnit * 4,
  },

  paymentActivityTabNavigation: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  paymentMethodCell: {
    fontWeight: 300,
    padding: paddingUnit * 2,
  },
  paymentMethodCellHeader: {
    fontWeight: 350,
    padding: paddingUnit * 2,
  },
  paymentStatusCell: {
    fontWeight: 300,
    padding: paddingUnit * 2,
  },
  paymentStatusCellContents: {
    alignItems: 'center',
    display: 'flex',
  },
  paymentStatusCellHeader: {
    fontWeight: 350,
    padding: paddingUnit * 2,
  },

  statusCircle: {
    borderRadius: '50%',
    height: '12px',
    marginRight: '8px',
    width: '12px',
  },
  transactionDateCell: {
    fontWeight: 300,
    padding: paddingUnit * 2,
  },
  transactionDateCellHeader: {
    fontWeight: 350,
    padding: paddingUnit * 2,
  },
  transactionHistoryContainer: {
    overflowX: 'auto',
  },
  transactionHistoryGrid: {
    paddingBottom: paddingUnit * 3,
  },
  transactionHistoryRow: {
    border: 'solid',
    borderColor: '#515151',
    borderLeft: 0,
    borderRight: 0,
    borderTop: 0,
    borderWidth: '1px',
    minWidth: '700px',
  },
}));

export default useTransactionHistoryStyles;
