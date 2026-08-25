import { makeStyles } from '@rbx/ui';

const useCashOutRobuxRateBreakdownStyles = makeStyles()((theme) => ({
  root: {
    padding: 12,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: theme.palette.components.input.outlined.enabledBorder,
    ...theme.border.radius.medium,
    rowGap: theme.spacing(2),
    marginTop: 4,
  },
  ratesHeading: {
    marginBottom: 5,
  },
  tierRowSpaced: {
    marginTop: 2,
  },
  tierNoteGrid: {
    marginTop: theme.spacing(0.2),
    marginBottom: theme.spacing(-0.5),
  },
  infoIcon: {
    position: 'relative' as const,
    top: -2,
  },
  robuxAmountText: {
    position: 'relative' as const,
    top: 1,
  },
  dividerWrapper: {
    marginTop: -4,
    marginBottom: -2,
  },
  gridItemGrow: {
    flex: '1 1 auto',
    minWidth: 0,
  },
  gridItemShrink: {
    flexShrink: 0,
  },
  infoIconCell: {
    paddingTop: theme.spacing(0.125),
  },
  tierNoteTextCell: {
    flex: '1 1 auto',
    minWidth: 0,
  },
  amountStackRoot: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 0,
  },
  amountStackRobuxRow: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '3px',
  },
  amountStackUsd: {
    fontWeight: 600,
  },
  amountStackUsdTypography: {
    marginTop: -2,
  },
}));

export default useCashOutRobuxRateBreakdownStyles;
