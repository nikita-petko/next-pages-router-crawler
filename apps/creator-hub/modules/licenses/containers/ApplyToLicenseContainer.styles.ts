import { makeStyles } from '@rbx/ui';

const useApplyToLicenseContainerStyles = makeStyles()((theme) => ({
  errorMessageStyle: {
    fontSize: 14,
    padding: '8px 0px 0px 0px',
  },

  row: {
    minWidth: 100,
    maxWidth: 600,
  },

  radioButton: {
    padding: '8px',
  },

  buttonLinkText: {
    color: theme.palette.actionV2.primary.fill,
  },

  inlineLinkButton: {
    paddingTop: '2px',
  },
}));

export default useApplyToLicenseContainerStyles;
