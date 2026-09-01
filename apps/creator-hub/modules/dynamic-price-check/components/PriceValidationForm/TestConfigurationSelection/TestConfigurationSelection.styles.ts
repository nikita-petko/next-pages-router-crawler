import { makeStyles } from '@rbx/ui';

const useTestConfigurationSelectionStyles = makeStyles()((theme) => ({
  radio: {
    marginLeft: theme.spacing(1),
  },
  disabled: {
    cursor: 'initial',
  },

  testRadioGroup: {
    paddingTop: theme.spacing(0.5),
    width: '100%',
  },
  testRadioGrid: {
    // Align with `FormControlLabel` margin placement
    marginLeft: '-3px',
    display: 'grid',
    gridTemplateColumns: '40px auto',
  },
  testRadioLabel: {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),

    width: '100%',
    cursor: 'pointer',
  },

  subselection: {
    ...theme.border.radius.medium,

    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    marginLeft: theme.spacing(4), // indent to align with selected radio

    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3),

    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  },

  priceRadioLabel: {
    // Account for robux icon + text
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },

  search: {
    marginTop: theme.spacing(2),
  },
}));

export default useTestConfigurationSelectionStyles;
