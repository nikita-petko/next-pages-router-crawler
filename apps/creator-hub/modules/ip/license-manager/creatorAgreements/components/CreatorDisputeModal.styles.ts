import { makeStyles } from '@rbx/ui';

const useCreatorDisputeModalStyles = makeStyles()((theme) => ({
  error: {
    paddingLeft: '16px',
  },
  option: {
    padding: theme.spacing(1),
  },
  stepper: {
    paddingLeft: theme.spacing(0.5),
    paddingRight: theme.spacing(0.5),
    paddingTop: theme.spacing(0.5),
    '& .MuiStepLabel-label.Mui-active': {
      fontWeight: theme.typography.fontWeightBold,
    },
    '& .MuiStepLabel-label.Mui-active .MuiTypography-root': {
      fontWeight: theme.typography.fontWeightBold,
    },
  },
  stepContent: {
    paddingBottom: theme.spacing(1),
    paddingLeft: theme.spacing(2.5),
    paddingRight: theme.spacing(1.5),
    paddingTop: theme.spacing(2.5),
  },

  /** Legal-agreements step: same horizontal inset as `stepContent`, more space below the stepper. */
  legalAgreementsStepContent: {
    paddingLeft: theme.spacing(3.5),
    paddingTop: theme.spacing(3.5),
  },

  /** Foundation `Checkbox` + MUI `FormControlLabel` (matches licenses ReviewTermsStep pattern). */
  disputeCheckboxFormLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    columnGap: theme.spacing(2),
    marginLeft: 0,
    marginRight: 0,
  },

  disputeCheckboxControlSlot: {
    display: 'inline-flex',
    flexShrink: 0,
    marginLeft: 0,
    marginTop: theme.spacing(0.125),
  },
}));

export default useCreatorDisputeModalStyles;
