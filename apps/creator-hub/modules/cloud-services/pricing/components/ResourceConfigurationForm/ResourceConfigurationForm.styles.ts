import { makeStyles } from '@rbx/ui';

const useResourceConfigurationFormStyles = makeStyles()((theme) => {
  return {
    currencySymbol: {
      marginLeft: 16,
      fontSize: 16,
      fontWeight: 8,
    },
    resourceTitle: {
      marginBottom: 4,
    },
    resourceFormContainer: {
      paddingTop: 32,
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
      width: '200px',
    },
    resourceDescription: {
      color: theme.palette.content.muted,
    },
  };
});

export default useResourceConfigurationFormStyles;
