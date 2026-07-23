import { makeStyles } from '@rbx/ui';

const useAudioDistributionStyles = makeStyles()(() => ({
  eligibilityContainer: {
    paddingLeft: 20,
  },

  alertLink: {
    color: 'inherit',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },

  distributionStatusContainer: {
    marginBottom: 10,
  },
}));

export default useAudioDistributionStyles;
