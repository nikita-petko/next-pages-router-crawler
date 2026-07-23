/* istanbul ignore file */

import { makeStyles } from '@rbx/ui';

export const useItemConfigureFormStyles = makeStyles()((theme) => ({
  submitButton: {
    margin: '0 12px',
    [theme.breakpoints.down('Large')]: {
      margin: '12px 0',
    },
  },

  pricingTableTitle: {
    margin: 'auto',
    fontSize: 'large',
    textAlign: 'center',
    paddingBottom: '30px',
  },

  formContainer: {
    width: '100%',
    '& > *:not(:last-child)': {
      paddingBottom: 48,
    },
    [theme.breakpoints.down('Large')]: {
      paddingLeft: 12,
      paddingRight: 12,
    },
  },

  inputForm: {
    width: '100%',
    '& > *:not(:last-child)': {
      paddingBottom: 24,
    },
  },

  earningMessage: {
    paddingLeft: 14,
  },

  errorMessageStyle: {
    width: '100%',
    marginTop: 4,
    paddingLeft: 14,
    paddingRight: 14,
    fontWeight: 'bold',
  },

  buttonContainer: {
    padding: '32px 0',
    flexDirection: 'row',
    [theme.breakpoints.down('Large')]: {
      flexDirection: 'column',
    },
  },

  switchPadding: { paddingLeft: 12 },

  itemCardImg: {
    display: 'inline-block',
    width: 250,
    height: 250,
    borderRadius: 8,
    [theme.breakpoints.down(1343)]: {
      width: 200,
      height: 200,
    },
  },

  moderatedCardImg: {
    position: 'relative',
    display: 'inline-block',
    width: 200,
    height: 200,
    borderRadius: 8,
    [theme.breakpoints.down(1343)]: {
      width: 200,
      height: 200,
    },
  },

  regionalPricingPreviewItemCardImg: {
    display: 'inline-block',
    width: 75,
    height: 75,
    borderRadius: 8,
    paddingTop: 0,
    marginLeft: '20px',
  },

  itemCardContainer: {
    paddingLeft: 24,
  },

  regionalPricingCheckbox: {
    left: '-10px',
    position: 'relative',
  },

  regionalPricingPreviewTable: {
    width: '100%',
  },

  searchIcon: {
    marginLeft: '14px',
  },

  regionalPricingPreviewPanelModal: {
    maxHeight: '80%',
    margin: 'auto',
    position: 'absolute',
  },

  viewDetailsButton: {
    padding: 0,
    minWidth: 'unset',
    textTransform: 'none',
    fontWeight: 'inherit',
  },
}));

export const useItemDetailsStyle = makeStyles<void, 'checked'>()((theme, _, classes) => ({
  root: {
    padding: theme.spacing(3),
    color: 'white',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  },
  form: {
    '& > *': {
      margin: theme.spacing(1),
      width: '100%',
    },
  },
  switchBase: {
    color: 'white',
    [`&.${classes.checked}`]: {
      color: 'white',
    },
    [`&.${classes.checked} + $track`]: {
      backgroundColor: 'white',
    },
  },
  checked: {},
  track: {},
}));

export const useSaleLocationAndRevenueStyles = makeStyles()((theme) => ({
  saleLocationSectionTitle: {
    fontSize: '24px',
    fontWeight: 450,
  },
  saleLocationSubsectionTitle: {
    fontSize: '18px',
    fontWeight: 450,
  },
  saleLocationHelperText: {
    color: theme.palette.content.muted,
  },
  placeIdWarningContainer: {
    display: 'inline-flex',
    marginTop: '5px',
  },
  placeIdWarningIcon: {
    marginRight: '5px',
  },
  placeIdTextField: {
    paddingTop: '5px',
  },
  saleLocationMarginTop32: {
    marginTop: '32px',
  },
  experiencesDescriptionPadding: {
    paddingRight: '20px',
  },
  splitBarContainer: {
    borderRadius: '8px',
    border: `1px solid ${theme.palette.states.focus}`,
    padding: '30px',
    width: '100%',
  },
  gridContainer: {
    width: '100%',
  },
  percentageItem: {
    height: '10px',
  },
  leftPercentageBar: {
    borderTopLeftRadius: '4px',
    borderBottomLeftRadius: '4px',
  },
  rightPercentageBar: {
    borderTopRightRadius: '4px',
    borderBottomRightRadius: '4px',
  },
  percentageLinearProgress: {
    height: '6px',
  },
  legendContainer: {
    width: '100%',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
  },
  colorIndicator: {
    height: '10px',
    width: '10px',
    marginRight: '5px',
  },
  increaseSplitBanner: {
    backgroundColor: theme.palette.states.disabledBackground,
  },
  closeIconButton: {
    height: '22px',
    width: '22px',
    paddingTop: '10px',
  },
  increaseSplitAlert: {
    fontWeight: 600,
  },
}));
