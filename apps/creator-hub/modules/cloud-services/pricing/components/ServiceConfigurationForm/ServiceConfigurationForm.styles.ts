import { makeStyles } from '@rbx/ui';

const useServiceConfigurationFormStyles = makeStyles()((theme) => {
  return {
    currencySymbol: {
      marginLeft: 16,
    },
    resourceTitle: {
      marginBottom: 4,
    },
    resourceFormContainer: {
      paddingTop: 32,
    },
    radioLabel: {
      paddingLeft: 6,
    },
    errorMessageContainer: {
      height: 20,
    },
    hidden: {
      display: 'none',
    },
    descriptionText: {
      marginTop: 6,
    },
    budgetTextField: {
      width: '100%',
    },
    resourceDescription: {
      color: theme.palette.content.muted,
    },
  };
});

export default useServiceConfigurationFormStyles;
