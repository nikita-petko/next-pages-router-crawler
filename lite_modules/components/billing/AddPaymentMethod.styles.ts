import { makeStyles } from '@rbx/ui';

import { marginUnit } from '@constants/styleConstants';

const useAddPaymentMethodStyles = makeStyles()((theme) => ({
  adCreditDialogContentText: {
    margin: '24px 0',
    textAlign: 'left',
  },
  // The two bulbs are the rounded end caps of `adCreditPurchaseContainer`'s left
  // border, so all three share one token. `content.muted` rather than a literal:
  // it stays within a few steps of the previous white in dark mode and inverts to
  // a slate in light mode, where a white rule and white caps were invisible.
  adCreditPurchaseBorderBulbBottom: {
    backgroundColor: theme.palette.content.muted,
    borderRadius: 4,
    bottom: -3.5,
    height: 6,
    left: -3.5,
    position: 'absolute',
    width: 6,
  },
  adCreditPurchaseBorderBulbTop: {
    backgroundColor: theme.palette.content.muted,
    borderRadius: 4,
    height: 6,
    left: -3.5,
    position: 'absolute',
    top: -3.5,
    width: 6,
  },
  adCreditPurchaseContainer: {
    borderLeft: `1px solid ${theme.palette.content.muted}`,
    flex: '1 0 0',
    flexDirection: 'column',
    marginRight: '6px',
    paddingLeft: 24,
    position: 'relative',
  },
  balanceCard: {
    flex: '1 0 0',
    minWidth: 200,
  },
  balanceContainerSection: {
    display: 'grid',
    gap: '24px',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(200px, 1fr)',
    [theme.breakpoints.down('Small')]: {
      gridTemplateColumns: '1fr',
    },
  },
  balanceContainerSectionItem: {
    minWidth: 0,
  },
  balanceInfoRow: {
    display: 'contents',
  },
  balanceInfoRows: {
    alignItems: 'center',
    columnGap: 8,
    display: 'grid',
    gridAutoRows: '28px',
    gridTemplateColumns: 'max-content minmax(0, 1fr)',
    marginBottom: marginUnit,
    rowGap: marginUnit,
  },
  balanceScopeSelector: {
    minWidth: 180,
    [theme.breakpoints.down('Small')]: {
      width: '100%',
    },
  },
  balanceScopeSelectorContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '24px',
    [theme.breakpoints.down('Small')]: {
      justifyContent: 'flex-start',
    },
  },
  balanceTypography: {
    fontWeight: 300,
    whiteSpace: 'nowrap',
  },
  buyAdCreditFormContainer: {
    margin: 0,
    maxWidth: 747,
  },
  buyAdCreditFormContainerCentered: {
    margin: '0 auto',
    maxWidth: 747,
  },
  buyAdCreditRow: {
    height: 79,
    marginBottom: 24,
  },
  buyButton: {
    height: 42,
    width: 81,
  },
  buyButtonRow: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: '12px',
  },
  cancelButton: {
    height: 42,
    width: 118,
  },
  costInRobuxAmount: {
    fontWeight: 'bold',
  },
  costInRobuxContainer: {
    flex: 1,
    marginBottom: '8px',
  },
  costInRobuxDescription: {
    marginRight: 48,
  },
  costInRobuxRow: {
    alignItems: 'center',
    marginBottom: 5,
  },
  creditCardFormContainer: {
    maxWidth: 700,
  },
  currentBalanceRow: {
    fontWeight: 350,
    marginBottom: marginUnit * 2,
  },
  dialogActionsCancelButton: {
    marginRight: 12,
  },
  dialogTitle: {
    padding: 24,
  },
  disclaimerHeader: {
    ontWeight: 400,
  },
  disclaimerHeaderContainer: {
    marginBottom: '8px',
  },
  disclaimerRow: {
    marginBottom: 32,
    marginTop: 32,
  },
  disclaimerRowInPaymentMethodDrawer: {
    marginBottom: 8,
    marginTop: 32,
  },
  disclaimerText: {
    fontSize: 12,
  },
  divider: {
    marginBottom: marginUnit * 4,
    marginTop: marginUnit * 4,
  },
  fullWidth: {
    width: '100%',
  },
  needMoreRobuxDescription: {
    fontSize: 12,
  },
  pageContent: {
    paddingTop: '6vh',
  },
  paymentMethodDrawerButtons: {
    '& > button': {
      width: 'auto',
    },
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: '12px',
    marginTop: '32px',
  },
  purchaseRateRow: {
    alignItems: 'center',
    display: 'inline-flex',
    gap: '4px',
    marginBottom: marginUnit * 4,
  },
  robuxBalanceContainer: {
    alignItems: 'center',
    display: 'flex',
    gap: '4px',
  },
  smallCostInRobuxIcon: {
    height: 16,
    margin: '0 4px',
    marginBottom: '-2px',
    width: 16,
  },
  smallRobuxIcon: {
    height: 16,
    width: 16,
  },
  stepLockedMessage: {
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(1),
  },
  subtitleContainer: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: marginUnit * 2,
    justifyContent: 'space-between',
    marginBottom: '24px',
    marginTop: 0,
  },
  tab: {
    borderBottom: 'solid',
    borderBottomColor: theme.palette.surface.outline,
    borderBottomWidth: '2px',
    opacity: 1,
    textTransform: 'uppercase',
  },
  tabs: {
    display: 'block',
    marginBottom: marginUnit * 6,
  },
  tabSelected: {
    borderBottom: 'solid',
    borderBottomColor: theme.palette.primary.main,
    borderBottomWidth: '2px',
    color: theme.palette.primary.main,
    opacity: 1,
    textTransform: 'uppercase',
  },
  watermarkedAdCreditBalanceSegment: {
    gridColumn: 3,
    [theme.breakpoints.down('Small')]: {
      gridColumn: 'auto',
    },
  },
  // Wraps the Robux amount, the Robux icon (which inherits this color), and the Ad
  // Credit amount. The Figma export named a variable that Foundation doesn't
  // define — the real prefix is `--color-content-*` — so `var()` always fell
  // through to its literal white and the whole row disappeared in light mode.
  watermarkedBalanceAmount: {
    alignItems: 'center',
    color: theme.palette.content.standard,
    display: 'inline-flex',
    verticalAlign: 'middle',
  },
  watermarkedBalanceBand: {
    alignItems: 'center',
    backgroundColor: theme.palette.action.hover,
    borderRadius: 8,
    display: 'grid',
    gap: '8px 16px',
    gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
    marginBottom: 24,
    padding: '16px 20px',
    [theme.breakpoints.down('Small')]: {
      gridTemplateColumns: '1fr',
    },
  },
  watermarkedBalanceOr: {
    [theme.breakpoints.down('Small')]: {
      display: 'none',
    },
    visibility: 'hidden',
  },
  watermarkedBalanceScopeSelector: {
    width: '100%',
  },
  watermarkedBalanceScopeSelectorContainer: {
    display: 'flex',
    justifyContent: 'flex-start',
    marginBottom: '24px',
    width: '100%',
  },
  watermarkedBalanceSegment: {
    alignItems: 'center',
    display: 'flex',
    gap: '6px',
  },
  watermarkedBreakdownRobuxIcon: {
    height: 16,
    width: 16,
  },
  // Same undefined-variable export as `watermarkedBalanceAmount`, so this always
  // painted its literal light grey — legible on the dark page, nearly invisible on
  // the light one. `content.muted` is that same grey in dark mode and inverts.
  watermarkedDisclaimerContent: {
    color: theme.palette.content.muted,
    fontFamily: 'var(--ALPHA-Text-BodySmall-FontFamily, "Builder Sans")',
    fontSize: 'var(--ALPHA-Text-BodySmall-FontSize, 12px)',
    fontStyle: 'normal',
    fontWeight: 400,
    letterSpacing: 'var(--ALPHA-Text-BodySmall-LetterSpacing, 0)',
    lineHeight: 'var(--ALPHA-Text-BodySmall-LineHeight, 18px)',
  },
  watermarkedDisclaimerHeader: {
    color: theme.palette.content.muted,
    fontFamily: 'var(--Config-Text-Font, "Builder Sans")',
    fontSize: 'var(--FontSize-FontSize_300, 12px)',
    fontStyle: 'normal',
    fontWeight: 700,
    lineHeight: '140%',
  },
  watermarkedDualInputRow: {
    alignItems: 'start',
    display: 'grid',
    gap: '16px',
    gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
    marginBottom: 8,
    [theme.breakpoints.down('Small')]: {
      gridTemplateColumns: '1fr',
    },
  },
  watermarkedInfoAlert: {
    alignItems: 'flex-start',
    backgroundColor: theme.palette.action.hover,
    borderRadius: 8,
    display: 'flex',
    gap: '8px',
    marginTop: 16,
    padding: '12px 16px',
  },
  watermarkedInfoAlertClose: {
    cursor: 'pointer',
    flexShrink: 0,
  },
  watermarkedInfoAlertContent: {
    alignItems: 'center',
    display: 'flex',
    flex: 1,
    gap: 16,
    justifyContent: 'space-between',
  },
  watermarkedInfoAlertIcon: {
    color: theme.palette.content.action,
  },
  // FieldLabelOffset supplies the drop past the field label, so this only has to
  // keep the column top-anchored and the text centered in its grid cell.
  watermarkedInputOr: {
    alignSelf: 'start',
    textAlign: 'center',
  },
  watermarkedStrikethroughRobux: {
    overflow: 'hidden',
    textAlign: 'center',
    textDecoration: 'line-through',
    textOverflow: 'ellipsis',
  },
  watermarkedTierCard: {
    border: '1px solid',
    borderColor: theme.palette.components.divider,
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginTop: 16,
    padding: '16px 20px',
  },
  watermarkedTierLabelGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  watermarkedTierRow: {
    alignItems: 'flex-start',
    display: 'flex',
    justifyContent: 'space-between',
  },
  watermarkedTierRowValues: {
    alignItems: 'flex-end',
    display: 'flex',
    flexDirection: 'column',
  },
  watermarkedTierValues: {
    alignItems: 'flex-end',
    display: 'flex',
    flexDirection: 'column',
    paddingTop: 26,
    textAlign: 'right',
  },
  watermarkedTooltipIcon: {
    alignItems: 'center',
    cursor: 'help',
    display: 'inline-flex',
    marginLeft: 4,
  },
  watermarkedTotalRow: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
  },
}));
export default useAddPaymentMethodStyles;
