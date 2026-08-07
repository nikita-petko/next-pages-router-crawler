import { useIsMutating } from '@tanstack/react-query';
import { developerProductKeys } from '../queries/constants';

/**
 * True while a bulk developer-product write is in flight. Both bulk mutations register the
 * same `batchUpdate` key, so callers outside the table can observe pending state without it
 * being threaded through props.
 */
export function useIsDeveloperProductsBulkActionPending(universeId: number): boolean {
  return useIsMutating({ mutationKey: developerProductKeys.batchUpdate(universeId) }) > 0;
}
