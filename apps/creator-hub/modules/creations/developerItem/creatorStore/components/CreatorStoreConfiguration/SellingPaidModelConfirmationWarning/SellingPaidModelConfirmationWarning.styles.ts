import { makeStyles } from '@rbx/ui';

const useSellingPaidModelConfirmationWarningStyles = makeStyles()(() => ({
  alertTitle: {
    paddingBottom: 4,
  },

  dialogContent: {
    paddingBottom: 0,
  },

  dialogPaper: {
    maxWidth: 600,
  },
}));

export default useSellingPaidModelConfirmationWarningStyles;
