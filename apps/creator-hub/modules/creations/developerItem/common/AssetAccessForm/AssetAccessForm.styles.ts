import { makeStyles } from '@rbx/ui';

const useAssetAccessFormStyles = makeStyles()(() => ({
  betaLabel: {
    height: 20,
    margin: '8px 0 0 12px',
  },

  containerDescription: {
    marginBottom: 16,
  },

  containerTitle: {
    marginBottom: 0,
  },

  dependencyDisclaimer: {
    marginTop: 8,
  },

  formContainer: {
    gridGap: 8,
  },
}));

export default useAssetAccessFormStyles;
