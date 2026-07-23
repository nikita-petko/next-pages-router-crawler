import { makeStyles } from '@rbx/ui';

const usePaymentsPageContainer = makeStyles()(() => {
  return {
    formContainer: {
      marginBottom: '250px',
    },
    paymentsTitle: {
      marginBottom: '40px',
    },
    paymentMethodTitle: {
      marginBottom: '20px',
    },
    upperDivider: {
      marginBottom: '20px',
    },
    lowerDivider: {
      marginTop: '20px',
    },
    paymentProfileContainer: {
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      alignItems: 'center',
      marginBottom: '20px',
    },
    paymentIconContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
    },
    deleteButton: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
    addPaymentMethodButton: {
      textTransform: 'none',
      marginTop: '32px',
    },
    betaTag: {
      marginTop: 8,
    },
  };
});

export default usePaymentsPageContainer;
