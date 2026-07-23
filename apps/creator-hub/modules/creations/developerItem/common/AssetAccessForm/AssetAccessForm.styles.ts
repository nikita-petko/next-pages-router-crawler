import { makeStyles } from '@rbx/ui';

const useAssetAccessFormStyles = makeStyles()(() => ({
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
