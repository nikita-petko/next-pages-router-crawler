import { makeStyles } from '@rbx/ui';

const useAdCreditTransactionHistoryStyles = makeStyles()(() => ({
  activityEllipsis: {
    display: 'inline-block',
    maxWidth: 280,
    width: '100%',
  },
  purchasedByAvatar: {
    height: 32,
    width: 32,
  },
  purchasedByCellContent: {
    alignItems: 'center',
    display: 'flex',
    gap: 12,
  },
}));

export default useAdCreditTransactionHistoryStyles;
