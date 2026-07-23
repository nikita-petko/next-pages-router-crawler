import type { MomentCreation } from '../types/MomentCreation';
import { MomentCreationStatus } from '../types/MomentCreation';
import type { StoredMomentCreation } from '../types/StoredMomentCreation';

/** Merges server moments with local drafts that are not yet on the server. */
export function mergeMoments(
  serverMoments: MomentCreation[],
  localMoments: StoredMomentCreation[],
): MomentCreation[] {
  const serverIds = new Set(serverMoments.map((moment) => moment.id));
  const localOnlyMoments = localMoments.filter((moment) => !serverIds.has(moment.id));

  return [...serverMoments, ...localOnlyMoments];
}

/** Returns local moment ids that are now represented on the server (any status). */
export function getSupersededLocalMomentIds(
  serverMoments: readonly MomentCreation[],
  localMoments: readonly StoredMomentCreation[],
): string[] {
  const serverIds = new Set(serverMoments.map((moment) => moment.id));

  return localMoments.filter((moment) => serverIds.has(moment.id)).map((moment) => moment.id);
}

/** Flattens paginated server responses and applies moderated status across all loaded pages. */
export function flattenServerMomentsFromPages(
  pages: readonly { moments: MomentCreation[]; moderatedMomentIds: readonly string[] }[],
): MomentCreation[] {
  const moderatedMomentIds = new Set(pages.flatMap((page) => page.moderatedMomentIds));
  const momentsById = new Map<string, MomentCreation>();

  for (const page of pages) {
    for (const moment of page.moments) {
      momentsById.set(moment.id, moment);
    }
  }

  return [...momentsById.values()].map((moment) =>
    moderatedMomentIds.has(moment.id)
      ? { ...moment, status: MomentCreationStatus.MODERATED }
      : moment,
  );
}

/** Applies in-memory metadata overrides for server-backed moments. */
export function applyMomentMetadataOverrides(
  moments: MomentCreation[],
  overrides: Record<string, Partial<MomentCreation>>,
): MomentCreation[] {
  return moments.map((moment) => {
    const override = overrides[moment.id];
    return override ? { ...moment, ...override } : moment;
  });
}
