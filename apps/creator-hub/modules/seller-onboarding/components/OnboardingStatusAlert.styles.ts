import { makeStyles } from '@rbx/ui';

const useOnboardingStatusAlertStyles = makeStyles()(() => ({
  alertLink: {
    color: 'inherit',
    textTransform: 'uppercase',
  },

  onboardingIndicatorContainer: {
    marginBottom: 10,
  },
}));

export default useOnboardingStatusAlertStyles;
