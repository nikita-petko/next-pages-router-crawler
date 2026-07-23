import { useContext } from 'react';
import badgeContext from '../providers/BadgeContext';

export default function useCurrentBadge() {
  return useContext(badgeContext);
}
