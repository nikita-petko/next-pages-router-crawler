import { makeStyles } from '@rbx/ui';

const usePriceValidationFormStyles = makeStyles()((theme) => ({
  formElements: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
  numberedFormElement: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '8px',
  },
  usernameChipsSection: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: '8px',
  },
  resetButton: {
    marginLeft: '-10px',
    fontWeight: 400,
  },
  radioButtons: {
    marginLeft: '8px',
  },
  actionContainer: {
    display: 'flex',
    gap: '12px',
    flexDirection: 'column',
    [theme.breakpoints.up('Medium')]: {
      flexDirection: 'row',
    },
  },
  fullWidth: {
    width: '100%',
  },
}));

export default usePriceValidationFormStyles;
