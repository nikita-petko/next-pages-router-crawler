import { makeStyles } from '@rbx/ui';

const marginUnit = 8;

const useSelectPaymentMethodStyles = makeStyles()(() => {
  return {
    cardNumberDropDown: {
      fontWeight: '350',
      fontSize: 18,
      display: 'none',
    },
    paymentSelector: {
      marginTop: 2,
    },
    listSubheaderLabel: {
      marginBottom: '10px',
      marginTop: '10px',
      textTransform: 'none',
      fontStyle: 'bold',
    },
    savePaymentWarningDescription: {
      display: 'block',
      marginTop: marginUnit * 4,
    },
    buttonContainer: {
      marginBottom: marginUnit * 2,
      textAlign: 'center',
    },
    saveButton: {
      textTransform: 'none',
      paddingLeft: marginUnit * 3,
      paddingRight: marginUnit * 3,
    },
    cancelButton: {
      textTransform: 'none',
    },
    bottomDivider: {
      display: 'block',
      marginBottom: marginUnit * 2,
      marginTop: marginUnit * 4,
    },
    menuItems: {
      display: 'none',
    },
    paymentIcons: {
      display: 'flex',
      alignItems: 'center',
    },
    paymentContainer: {
      marginRight: '5px',
    },
    circularSpace: {
      marginRight: '10px',
    },
  };
});

export default useSelectPaymentMethodStyles;
