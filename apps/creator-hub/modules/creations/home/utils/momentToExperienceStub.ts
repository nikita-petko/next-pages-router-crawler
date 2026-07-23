import type { TExperience } from '@modules/home/providers/ExperienceProvider';
import type { MomentCreation } from '../types/MomentCreation';

/** Minimal experience fields used by moment edit/create search controls. */
export type MomentExperienceStub = Pick<TExperience, 'id' | 'name'>;

export function getMomentExperienceId(moment: MomentCreation): number | undefined {
  if (moment.universeId != null) {
    return moment.universeId;
  }

  if ('experienceId' in moment && typeof moment.experienceId === 'number') {
    return moment.experienceId;
  }

  return undefined;
}

function getMomentUniverseId(moment: MomentCreation): number {
  return getMomentExperienceId(moment) ?? 0;
}

/** Builds a minimal experience object for search/preview controls when editing a moment row. */
export function momentToExperienceStub(moment: MomentCreation): MomentExperienceStub {
  return {
    id: getMomentUniverseId(moment),
    name: moment.experienceName,
  };
}
