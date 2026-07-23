import { makeStyles } from '@rbx/ui';

const useServiceConfigurationFormStyles = makeStyles()((theme) => {
  return {
    resourceTitle: {
      ...theme.typography.subtitle1,
      fontWeight: theme.typography.fontWeightBold,
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
      ...theme.typography.body2,
      color: theme.palette.content.muted,
    },
  };
});

export default useServiceConfigurationFormStyles;
