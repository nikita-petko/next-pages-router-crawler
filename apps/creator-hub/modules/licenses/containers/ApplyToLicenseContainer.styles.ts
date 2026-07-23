import { makeStyles } from '@rbx/ui';

const useApplyToLicenseContainerStyles = makeStyles()((theme) => ({
  errorMessageStyle: {
    fontSize: 14,
    padding: `${theme.spacing(1)} 0 0 0`,
  },

  row: {
    minWidth: 100,
    maxWidth: 600,
  },

  radioButton: {
    padding: theme.spacing(0.75),
  },

  buttonLinkText: {
    color: theme.palette.actionV2.primary.fill,
  },

  inlineLinkButton: {
    paddingTop: theme.spacing(0.25),
  },

  /** Foundation `Checkbox` + `FormControlLabel` spacing (ReviewTermsStep). */
  reviewTermsCheckboxFormLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    columnGap: theme.spacing(2),
    marginLeft: 0,
    marginRight: 0,
  },

  reviewTermsCheckboxControlSlot: {
    display: 'inline-flex',
    flexShrink: 0,
    marginLeft: 0,
    marginTop: theme.spacing(0.125),
  },

  /** Keeps section heading and checkbox column on one grid track so left edges match. */
  reviewTermsAgreeHeading: {
    marginLeft: 0,
    marginRight: 0,
    paddingBottom: theme.spacing(1),
  },

  /** `spacing(1)` under title + this `spacing(2)` → `spacing(3)` from title text to first checkbox. */
  reviewTermsFirstCheckboxBlock: {
    marginTop: theme.spacing(2),
  },

  /** Between the two agreement checkbox rows. */
  reviewTermsConsentCheckboxRow: {
    marginTop: theme.spacing(1.5),
  },
}));

export default useApplyToLicenseContainerStyles;
