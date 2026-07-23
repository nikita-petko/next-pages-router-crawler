import { makeStyles } from '@rbx/ui';

const useCashOutBoxStyles = makeStyles()((theme) => ({
  root: {
    padding: '8px 16px',
    margin: 'auto',
    width: '100%',
    background: theme.palette.actionV2.secondary.fill,
    borderRadius: 5,
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  leftContainer: {
    display: 'flex',
    alignItems: 'center',
    marginLeft: -8, // Offset the left padding
    marginTop: -8, // Offset the top padding
  },

  robuxAmount: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },

  robuxAmountValueContainer: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: 2,
    gap: 4,
  },

  robuxAmountNumber: {
    lineHeight: '100%',
  },

  cashoutUsdAmountText: {
    fontWeight: 600,
    textAlign: 'right',
    marginRight: 17,
  },

  iconBig: {
    fontSize: '1.75rem',
    marginRight: 8,
    alignSelf: 'flex-start',
  },

  iconSmall: {
    fontSize: '1rem',
    marginLeft: 4,
    marginRight: 4,
  },

  iconLink: {
    lineHeight: 0,
    marginLeft: 8,
    marginTop: 4,
    color: theme.palette.content.standard,
    textDecoration: 'underline',
    alignSelf: 'flex-start',
    '&:hover': {
      textDecoration: 'underline',
    },
  },

  tooltip: {
    whiteSpace: 'nowrap',
    maxWidth: 'none',
  },
}));

export default useCashOutBoxStyles;
