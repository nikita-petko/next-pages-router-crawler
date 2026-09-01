import { makeStyles } from '@rbx/ui';

const useEligibilityFormStyles = makeStyles()(() => {
  const marginUnit = 8;

  return {
    prereqTitle: {
      marginBottom: marginUnit * -2,
    },
    eligibilityDescription: {
      marginTop: -2,
      marginLeft: marginUnit * 1.5,
      paddingLeft: marginUnit,
      display: 'flex',
      alignItems: 'center',
    },
    eligibilityIcon: {
      marginLeft: marginUnit,
      display: 'flex',
      alignItems: 'center',
    },
    titleDescription: {
      marginTop: -32,
    },
    legalDescription: {
      marginTop: -16,
    },
    terms: {
      marginTop: -24,
    },
    submitTermsButton: {
      marginTop: -16,
    },
  };
});

export default useEligibilityFormStyles;
