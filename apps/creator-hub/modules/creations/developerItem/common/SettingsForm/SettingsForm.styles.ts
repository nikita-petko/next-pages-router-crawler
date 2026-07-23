import { makeStyles } from '@rbx/ui';

const useSettingsFormStyles = makeStyles()((theme) => ({
  formContainer: {
    gridGap: 24,
  },

  switchContainer: {
    alignItems: 'flex-start',
  },

  distributionAlertContainer: {
    marginBottom: 12,
  },

  distributionLabel: {
    display: 'block',
    paddingTop: 8,
    paddingBottom: 8,
  },

  distributionText: {
    display: 'block',
    paddingTop: 4,
  },

  distributionAlert: {
    color: theme.palette.actionV2.primary.fill,
    borderColor: theme.palette.surface.outline,
  },

  alertTitle: {
    lineHeight: '22px',
  },
}));

export default useSettingsFormStyles;
