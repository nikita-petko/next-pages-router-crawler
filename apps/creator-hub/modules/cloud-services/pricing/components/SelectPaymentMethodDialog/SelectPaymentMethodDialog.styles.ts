import { makeStyles } from '@rbx/ui';

const marginUnit = 8;

const useSelectPaymentMethodDialogStyles = makeStyles()(() => {
  return {
    topDivider: {
      display: 'block',
      marginBottom: marginUnit * 2,
      marginTop: marginUnit * 2,
    },
    addPaymentMethodHeader: {
      display: 'block',
      marginBottom: marginUnit,
    },
    addPaymentMethodDescription: {
      display: 'block',
      marginBottom: marginUnit * 3,
    },
  };
});

export default useSelectPaymentMethodDialogStyles;
