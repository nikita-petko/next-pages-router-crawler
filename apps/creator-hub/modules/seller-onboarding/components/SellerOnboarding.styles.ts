import { makeStyles } from '@rbx/ui';

const useSellerOnboardingStyles = makeStyles()(() => ({
  countryErrorContainer: {
    paddingLeft: '14px',
    paddingTop: '3px',
  },

  continueButton: {
    textTransform: 'none',
  },

  editButton: {
    textTransform: 'none',
  },

  eligibilityContainer: {
    paddingLeft: '24px',
  },

  prerequisitesContainer: {
    marginTop: '8px',
    marginBottom: '24px',
  },

  sectionWithVerticalSpacing: {
    marginBottom: '24px',
    marginTop: '24px',
  },

  statusContainer: {
    paddingBottom: '24px',
  },
}));

export default useSellerOnboardingStyles;
