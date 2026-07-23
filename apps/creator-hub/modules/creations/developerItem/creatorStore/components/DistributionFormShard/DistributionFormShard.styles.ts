import { makeStyles } from '@rbx/ui';

const useDistributionFormShardStyles = makeStyles()(() => ({
  currencyPricingContainer: {
    marginBottom: 12,
  },

  hiddenContainer: {
    display: 'none',
  },

  indentContainer: {
    gridGap: 24,
    marginLeft: 12,
  },

  pricingCaptionContainer: {
    gridGap: 12,
    marginBottom: 36,
  },

  settingsContainer: {
    marginBottom: 24,
  },

  subtitleContainer: {
    paddingBottom: 12,
  },

  switchContainer: {
    alignItems: 'flex-start',
  },

  switchLabel: {
    display: 'block',
    paddingTop: 8,
    paddingBottom: 8,
  },

  switchText: {
    display: 'block',
    paddingTop: 4,
  },
}));

export default useDistributionFormShardStyles;
