import type {
  MomentCreation,
  MomentCreationBase,
  ServerMomentCreation,
} from '../types/MomentCreation';
import { getMomentRowKey } from './momentsIdentityUtils';

/**
 * In-session edits to a server-backed moment, applied on top of the fetched list until the next
 * refetch.
 *
 * Restricted to base fields plus `modifiedAt`: `Partial<MomentCreation>` distributes badly over the
 * union, and draft-only keys such as `draftId` or `experienceId` must never be applied to a server
 * moment.
 */
export type MomentMetadataOverride = Partial<
  Pick<MomentCreationBase, 'description' | 'experienceName' | 'locale'>
> & { modifiedAt?: string };

/** Flattens paginated server responses, keeping the last-seen copy of each moment. */
export function flattenServerMomentsFromPages(
  pages: readonly { moments: ServerMomentCreation[] }[],
): ServerMomentCreation[] {
  const momentsByKey = new Map<string, ServerMomentCreation>();

  for (const page of pages) {
    for (const moment of page.moments) {
      momentsByKey.set(getMomentRowKey(moment), moment);
    }
  }

  return [...momentsByKey.values()];
}

/** Applies in-memory metadata overrides, keyed by `getMomentRowKey`. */
export function applyMomentMetadataOverrides(
  moments: MomentCreation[],
  overrides: Record<string, MomentMetadataOverride>,
): MomentCreation[] {
  return moments.map((moment) => {
    const override = overrides[getMomentRowKey(moment)];
    return override ? { ...moment, ...override } : moment;
  });
}
