import { makeStyles } from '@rbx/ui';

const useExperienceAccessPaymentFormStyles = makeStyles()((theme) => ({
  background: {
    backgroundColor: theme.palette.background.paper,
    marginTop: 16,
    borderRadius: 4,
  },

  textField: {
    padding: 24,
  },

  marketFeeTypography: {
    color: theme.palette.text.primary,
    paddingLeft: 24,
    paddingBottom: 24,
    paddingRight: 24,
  },

  earningFeeTypography: {
    color: theme.palette.text.primary,
    paddingLeft: 24,
    paddingBottom: 24,
    paddingRight: 24,
  },

  errorMessageStyles: {
    width: '100%',
    marginTop: 4,
    paddingLeft: 14,
    paddingRight: 14,
    color: theme.palette.error.main,
    fontWeight: 'bold',
    fontSize: 12,
  },

  switchStyle: {
    paddingLeft: 10,
  },
}));

export default useExperienceAccessPaymentFormStyles;
