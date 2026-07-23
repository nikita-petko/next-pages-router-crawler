import { makeStyles } from '@rbx/ui';

import { marginUnit } from '@constants/styleConstants';

const useAddPaymentMethodStyles = makeStyles()((theme) => ({
  adCreditDialogContentText: {
    margin: '24px 0',
    textAlign: 'left',
  },
  adCreditPurchaseBorderBulbBottom: {
    backgroundColor: 'white',
    borderRadius: 4,
    bottom: -3.5,
    height: 6,
    left: -3.5,
    position: 'absolute',
    width: 6,
  },
  adCreditPurchaseBorderBulbTop: {
    backgroundColor: 'white',
    borderRadius: 4,
    height: 6,
    left: -3.5,
    position: 'absolute',
    top: -3.5,
    width: 6,
  },
  adCreditPurchaseContainer: {
    borderLeft: '1px solid white',
    flex: '1 0 0',
    flexDirection: 'column',
    marginRight: '6px',
    paddingLeft: 24,
    position: 'relative',
  },
  balanceCard: {
    border: 4,
    display: 'flex',
    flex: '1 0 0',
    flexDirection: 'column',
    minWidth: 200,
    padding: '16px',
    width: '100%',
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
    alignItems: 'center',
    display: 'flex',
    height: 28,
    marginBottom: marginUnit,
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
    marginRight: 8,
    width: 72,
  },
  buyAdCreditFormContainer: {
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
    borderBottomColor: '#565656',
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
  watermarkedBalanceBand: {
    alignItems: 'center',
    backgroundColor: theme.palette.action.hover,
    borderRadius: 8,
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px 24px',
    justifyContent: 'space-between',
    marginBottom: 24,
    padding: '16px 20px',
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
  watermarkedDualInputRow: {
    display: 'grid',
    gap: '16px',
    gridTemplateColumns: '1fr 1fr',
    marginBottom: 8,
    [theme.breakpoints.down('Small')]: {
      gridTemplateColumns: '1fr',
    },
  },
  watermarkedErrorCard: {
    border: '1px solid',
    borderColor: theme.palette.error.main,
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: 16,
    padding: '16px 20px',
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
    flex: 1,
  },
  watermarkedInputRobuxAdornment: {
    marginRight: 8,
  },
  watermarkedStrikethroughRobux: {
    textDecoration: 'line-through',
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
  watermarkedTierLabel: {
    fontWeight: 500,
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
  watermarkedTierSubtext: {
    fontSize: 12,
  },
  watermarkedTooltipIcon: {
    alignItems: 'center',
    cursor: 'help',
    display: 'inline-flex',
    marginLeft: 4,
  },
  watermarkedTotalLabel: {
    fontWeight: 500,
    textTransform: 'capitalize',
  },
  watermarkedTotalRow: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
  },
}));
export default useAddPaymentMethodStyles;
