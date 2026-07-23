import { makeStyles } from '@rbx/ui';

const useDeveloperProductRegionalPricingDisclaimerModalStyles = makeStyles()((theme) => ({
  modalAlert: {
    marginTop: '12px',
    // Need the below overrides to not impact overlapping styles from inputs in the message
    '& .MuiAlert-icon': {
      marginRight: 0, // Original: '12px'
    },
    '& .MuiAlert-message': {
      paddingLeft: '12px', // Original: 0
    },
  },
  fontWeightLight: {
    fontWeight: theme.typography.fontWeightLight,
  },
}));

export default useDeveloperProductRegionalPricingDisclaimerModalStyles;
