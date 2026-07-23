import { makeStyles } from '@rbx/ui';

const useEligibilityRowStyles = (isLowerCaseLink = false) => {
  return makeStyles()(() => ({
    buttonText: {
      cursor: 'pointer',
      textTransform: isLowerCaseLink ? 'none' : 'uppercase',
    },

    headerContainer: {
      paddingBottom: 4,
    },

    iconContainer: {
      paddingRight: 16,
    },
  }));
};

export default useEligibilityRowStyles;
