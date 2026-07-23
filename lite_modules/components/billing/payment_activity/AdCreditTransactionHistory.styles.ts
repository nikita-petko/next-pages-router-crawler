import { makeStyles } from '@rbx/ui';

const useAdCreditTransactionHistoryStyles = makeStyles()(() => ({
  activityEllipsis: {
    display: 'inline-block',
    maxWidth: 280,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    width: '100%',
  },
  noWrap: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
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
