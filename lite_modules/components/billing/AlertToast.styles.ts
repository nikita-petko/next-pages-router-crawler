import { makeStyles } from '@rbx/ui';

const useAlertToastStyles = makeStyles()(() => ({
  alertAction: {
    paddingTop: '0px',
  },

  alertContainer: {
    borderRadius: '0',
  },

  alertRoot: {
    alignItems: 'center',
    display: 'flex',
  },

  secondaryButton: {
    marginRight: '12px',
  },
}));

export default useAlertToastStyles;
