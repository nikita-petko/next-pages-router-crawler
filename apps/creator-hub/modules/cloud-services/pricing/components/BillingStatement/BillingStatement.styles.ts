import { makeStyles } from '@rbx/ui';

const useBillingStatementStyles = makeStyles()((theme) => {
  return {
    sectionTitle: {
      paddingTop: 18,
      paddingBottom: 12,
    },
    usageSection: {
      gap: 12,
    },
    divider: {
      width: '100%',
    },
    noDataText: {
      textAlign: 'center',
    },
    robloxCityZip: {
      marginBottom: '6px',
      whiteSpace: 'nowrap',
    },
    addressLines: {
      marginBottom: '6px',
      whiteSpace: 'nowrap',
    },
    transactionLabel: {
      marginLeft: 8,
    },
    invoiceLines: {
      borderBottom: `solid 1px ${theme.palette.surface.outline}`,
      paddingTop: 4,
      margin: '0 10px',
    },
    secondaryAddressLines: {
      marginBottom: '12px',
    },
    tableContainer: {
      maxHeight: 450,
    },
    billId: {
      marginTop: '4px',
      marginBottom: '4px',
    },
    vatText: {
      paddingTop: 4,
    },
    totalText: {
      paddingTop: 6,
    },
  };
});

export default useBillingStatementStyles;
