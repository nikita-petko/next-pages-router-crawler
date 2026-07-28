import { makeStyles } from '@rbx/ui';

const useBillingStatementPaymentsStyles = makeStyles()(() => {
  return {
    sectionTitle: {
      paddingTop: 18,
      paddingBottom: 18,
    },
    transactionLabel: {
      marginLeft: 8,
      paddingLeft: 0,
      paddingRight: 16,
    },
    tableContainer: {
      maxHeight: 450,
    },
    amountRow: {
      paddingLeft: 0,
      textAlign: 'right',
    },
    labelRow: {
      paddingLeft: 32,
      paddingRight: 0,
    },
    amountCell: {
      display: 'flex',
      justifyContent: 'flex-start',
    },
    typeRow: {
      justifyContent: 'flex-end',
      marginLeft: 24,
      paddingLeft: 0,
      textAlign: 'left',
    },
  };
});

export default useBillingStatementPaymentsStyles;
