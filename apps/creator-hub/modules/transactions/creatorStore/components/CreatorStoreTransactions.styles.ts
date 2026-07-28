import { makeStyles } from '@rbx/ui';

const useCreatorMarketplaceTransactionsStyles = makeStyles()(() => ({
  fullWidth: {
    width: '100%',
  },

  onboardingContainer: {
    paddingBottom: '30px',
  },

  payoutContainer: {
    paddingBottom: '30px',
  },

  paymentTypeDropdown: {
    minWidth: '200px',
  },

  exportReport: {
    marginLeft: 'auto',
    marginTop: 'auto',
    marginBottom: 'auto',
  },

  resetButton: {
    marginTop: 'auto',
    marginBottom: 'auto',
  },
}));

export default useCreatorMarketplaceTransactionsStyles;
