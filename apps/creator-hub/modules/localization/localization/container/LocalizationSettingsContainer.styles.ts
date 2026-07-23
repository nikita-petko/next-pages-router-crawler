import { makeStyles } from '@rbx/ui';

const LocalizationSettingsContainerStyles = makeStyles()((theme) => ({
  descriptionText: {
    marginBottom: 25,
  },

  divider: {
    marginTop: 15,
    marginBottom: 15,
  },

  container: {
    marginTop: 10,
    marginBottom: 10,
  },

  selectPadding: {
    paddingRight: theme.spacing(1),
  },

  selectWidth: {
    width: `100%`,
  },

  panelStyle: {
    marginTop: theme.spacing(1 / 2),
  },

  clearDescriptionText: {
    marginTop: theme.spacing(1),
  },

  toggleButton: {
    marginTop: -10,
  },

  automaticEntriesSettingToggle: {
    marginTop: 10,
  },

  atcContainer: {
    display: 'flex',
    justifyContent: 'space-between',
  },
}));

export default LocalizationSettingsContainerStyles;
