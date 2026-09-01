import { useIsMutating } from '@tanstack/react-query';
import { gamePassKeys } from '../queries/constants';

/**
 * True while a bulk pass write is in flight. Both bulk mutations register the same
 * `batchUpdate` key, so callers outside the table can observe pending state without
 * it being threaded through props.
 */
export function useIsPassesBulkActionPending(universeId: number): boolean {
  return useIsMutating({ mutationKey: gamePassKeys.batchUpdate(universeId) }) > 0;
}
