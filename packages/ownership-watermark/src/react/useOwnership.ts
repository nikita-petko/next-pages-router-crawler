import { useContext } from 'react';
import { OwnershipContext } from './OwnershipContext';

/**
 * Access the nearest ownership context. v3 renderers require `payload`;
 * the `teamId` field is diagnostics only.
 */
export default function useOwnership() {
  return useContext(OwnershipContext);
}
