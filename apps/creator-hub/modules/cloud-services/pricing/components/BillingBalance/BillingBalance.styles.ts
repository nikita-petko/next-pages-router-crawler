import { makeStyles } from '@rbx/ui';

const useBillingBalanceStyles = makeStyles()((theme) => {
  return {
    sectionContainer: {
      padding: 24,
      paddingRight: 2,
    },
    balanceContainer: {
      marginLeft: -32,
      padding: 24,
      paddingRight: 32,
    },
    monthToDateCostText: {
      marginRight: 16,
    },
    descriptionText: {
      marginTop: 4,
      paddingTop: 16,
    },
    viewDetailButton: {
      marginTop: -10,
      marginLeft: 24,
      fontSize: 12,
    },
    cardNumberDropDown: {
      fontWeight: '350',
      fontSize: 18,
    },
    paymentSelector: {
      marginTop: 12,
      width: '100%',
    },
    addMenuItem: {
      display: 'flex',
      alignItems: 'center',
    },
    infoToolTip: {
      paddingTop: 2,
      marginLeft: 8,
    },
    paymentHeader: {
      paddingBottom: 4,
    },
    costDivider: {
      borderLeft: `1px solid ${theme.palette.components.divider}`, // Vertical line
      height: '100%', // Full height of the container
      marginLeft: -16,
    },
    paymentContainer: {
      paddingRight: 40,
    },
    billingActivitiesContainer: {
      paddingBottom: 40,
    },
    paymentDescription: {
      paddingTop: 16,
      paddingRight: 24,
    },
  };
});

export default useBillingBalanceStyles;
