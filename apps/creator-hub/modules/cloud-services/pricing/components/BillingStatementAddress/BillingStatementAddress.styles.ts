import { makeStyles } from '@rbx/ui';

const useBillingStatementAddressStyles = makeStyles()(() => {
  return {
    robloxCityZip: {
      marginBottom: '8px',
      whiteSpace: 'nowrap',
    },
    addressLines: {
      marginBottom: '8px',
      whiteSpace: 'nowrap',
    },
    secondaryAddressLines: {
      marginBottom: '8px',
    },
  };
});

export default useBillingStatementAddressStyles;
