import { makeStyles } from '@rbx/ui';

const useFormStyles = makeStyles()((theme) => ({
  root: {
    flexDirection: 'column',
    [theme.breakpoints.down('Medium')]: {
      padding: `0px 8px`,
    },
  },

  textField: {
    width: '100%',
    maxWidth: 750,
  },

  errorAdornment: {
    marginLeft: 8,
    display: 'flex',
    alignItems: 'center',
    color: theme.palette.actionV2.important.fill,
  },

  robuxAdornment: {
    marginRight: 8,
    display: 'flex',
    alignItems: 'center',
  },

  robuxError: {
    color: theme.palette.actionV2.important.fill,
  },

  marginRight: {
    marginRight: 12,
  },

  robuxAmountHelperContent: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },

  robuxRateSummaryToggle: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: 0,
    margin: 0,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: 'inherit',
    font: 'inherit',
    lineHeight: 0,
  },

  availableRobuxHelper: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
  },

  robuxRateBreakdownContainer: {
    width: 440,
    maxWidth: '100%',
    marginTop: theme.spacing(1),
  },

  helperText: {
    margin: '5px 0px 0px 0px',
  },

  expandIcon: {
    transition: 'transform 0.2s ease',
    position: 'relative' as const,
    top: -1,
  },

  expandIconExpanded: {
    transform: 'rotate(180deg)',
  },
}));

export default useFormStyles;
