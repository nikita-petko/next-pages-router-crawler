import { createContext } from 'react';
import type { GetBadgeByIdResponse } from '@modules/clients/badges';

export interface BadgeDetailsContextValue {
  isBadgeRefreshRequired: boolean;
  badgeDetails: GetBadgeByIdResponse | undefined;
  refreshBadgeDetails: () => void;
  isBadgeLoading: boolean;
}

const badgeContext = createContext<BadgeDetailsContextValue>({
  isBadgeRefreshRequired: false,
  badgeDetails: undefined,
  refreshBadgeDetails: () => ({}),
  isBadgeLoading: false,
});
badgeContext.displayName = 'Badge';

export default badgeContext;
