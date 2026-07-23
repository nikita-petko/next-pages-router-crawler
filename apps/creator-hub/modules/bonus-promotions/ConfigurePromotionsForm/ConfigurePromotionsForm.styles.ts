import { makeStyles } from '@rbx/ui';

const useConfigureSalesFormStyles = makeStyles()((theme) => ({
  itemForPromotionsLabel: {
    marginTop: 24,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flexWrap: 'nowrap',
  },

  itemForPromotions: {
    marginTop: 8,
  },

  moderationStatus: {
    gap: 11,
  },

  buttonContainer: {
    display: 'flex',
    gap: 12,
    padding: '32px 0',
    flexDirection: 'column-reverse',
    [theme.breakpoints.up('Medium')]: {
      flexDirection: 'row',
    },
  },

  errorMessageStyles: {
    width: '100%',
    marginTop: 16,
    paddingLeft: 8,
    paddingRight: 8,
    color: theme.palette.actionV2.important.fill,
    fontWeight: 'bold',
    fontSize: 12,
  },
}));

export default useConfigureSalesFormStyles;
