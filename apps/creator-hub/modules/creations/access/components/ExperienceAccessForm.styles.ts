import { makeStyles } from '@rbx/ui';

const useExperienceAccessFormStyles = makeStyles()((theme) => ({
  formContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    [theme.breakpoints.down('Large')]: {
      paddingLeft: 12,
      paddingRight: 12,
    },
  },

  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },

  controls: {
    paddingTop: 12,
    paddingLeft: 12,
    display: 'flex',
    flexDirection: 'column',
  },

  buttonContainer: {
    padding: '32px 0',
    flexDirection: 'row',
    [theme.breakpoints.down('Large')]: {
      flexDirection: 'column',
    },
  },

  subTitle: {
    paddingTop: 48,
  },

  saveChangesButton: {
    margin: '0 12px',
    [theme.breakpoints.down('Large')]: {
      margin: '12px 0',
    },
  },

  switchStyle: {
    paddingLeft: 10,
    paddingTop: 8,
  },

  privateServerSwitch: {
    paddingLeft: 10,
    paddingTop: 32,
  },

  formHelperTextStyle: {
    paddingBottom: 16,
  },

  activeServer: {
    paddingTop: 24,
    marginLeft: 24,
    paddingRight: 24,
  },

  activeSubscription: {
    paddingTop: 32,
    marginLeft: 24,
    paddingBottom: 24,
    paddingRight: 24,
  },

  background: {
    backgroundColor: theme.palette.surface[200],
    marginBottom: 24,
    borderRadius: 4,
  },

  privateServerGrid: {
    marginTop: 32,
  },

  errorMessageStyle: {
    marginLeft: 24,
    fontWeight: 'bold',
    fontSize: 12,
  },

  paymentSelectionLabel: {
    paddingTop: 8,
    paddingBottom: 8,
    marginBottom: 8,
  },

  paymentSelectionContainer: {
    alignItems: 'start',
  },

  placeJoinRestrictionLabel: {
    paddingTop: 8,
    paddingBottom: 8,
    marginBottom: 8,
  },

  placeJoinRestrictionContainer: {
    alignItems: 'start',
  },

  devicesTooltip: {
    lineHeight: '1.3',
    fontWeight: 700,
  },

  title: {
    marginBottom: 4,
    lineHeight: 1.4,
    fontWeight: 700,
  },

  paymentSettingsCard: {
    backgroundColor: theme.palette.surface[200],
    borderRadius: 4,
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 24,
    paddingRight: 24,
  },

  infoIcon: {
    marginLeft: 4,
    verticalAlign: 'text-bottom',
    cursor: 'pointer',
  },

  tooltip: {
    lineHeight: '1.3',
    fontWeight: 700,
  },

  paymentSettingsContainer: {
    display: 'flex',
    alignItems: 'flex-start',
    background: theme.palette.surface[200],
    borderRadius: '8px',
    paddingRight: '24px',
    paddingBottom: '16px',
    paddingLeft: '24px',
    paddingTop: '16px',
    margin: 0,
  },

  toolTipLabelContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },

  tooltipLabel: {
    minWidth: 625,
  },

  placeAccessFormHelperText: {
    paddingBottom: 0,
    marginBottom: 0,
    marginTop: 8,
  },

  placeJoinRestrictionRadioGroup: {
    paddingLeft: 10,
    paddingTop: 0,
    marginTop: -4,
  },
}));

export default useExperienceAccessFormStyles;
