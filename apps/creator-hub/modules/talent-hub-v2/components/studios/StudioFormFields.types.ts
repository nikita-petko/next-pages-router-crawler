import type {
  CreateStudioRequest,
  TeamSize,
  UpdateStudioRequest,
} from '@rbx/client-talent-hub-v2-service/v2';
import { parseGroupUrl } from '../../utils/parseGroupUrl';

/**
 * Incorporation fields the form collects today but that the generated
 * client model doesn't yet expose. Defined as a named extension so the
 * forward-compat payload shape is described in the type system instead
 * of bypassed with an `as` assertion.
 */
interface StudioIncorporationFields {
  legalBusinessName: string;
  countryOfIncorporation: string;
  stateOfIncorporation: string;
}

type CreateStudioRequestWithIncorporation = CreateStudioRequest & StudioIncorporationFields;
type UpdateStudioRequestWithIncorporation = UpdateStudioRequest & StudioIncorporationFields;

/**
 * Form state for both Create and Edit. Superset of
 * {@link CreateStudioRequest} / {@link UpdateStudioRequest}: the form carries
 * `groupUrl` (resolved to `groupId` on create) and the business-incorporation
 * fields (`legalBusinessName`, `countryOfIncorporation`,
 * `stateOfIncorporation`) that are not yet part of the generated client models.
 *
 * The incorporation fields are required in the UI (per Figma) but are dropped
 * from API payloads while {@link SUBMIT_INCORPORATION_FIELDS} is false. Flip
 * the flag when the backend schema accepts them.
 *
 * DUNS was previously collected here; that field has been removed pending an
 * alternate business-verification path (Persona) for MVP.
 */
export interface StudioFormState {
  name: string;
  email: string;
  description: string;
  /** `null` when unset; callers should validate before submit. */
  teamSize: TeamSize | null;
  /** Roblox group URL or numeric id; parsed to `groupId` for create. */
  groupUrl: string;
  website: string;
  /** ATS/careers URL; edit flow only (Create omits from API). */
  atsLink: string;
  experiences: Array<number | null>;
  /** Legal business name (Dun & Bradstreet record). UI-only until BE schema lands. */
  legalBusinessName: string;
  /** ISO 3166-1 alpha-2 country code. UI-only until BE schema lands. */
  countryOfIncorporation: string;
  /** Subdivision code (e.g. US state) or free-text province. UI-only until BE schema lands. */
  stateOfIncorporation: string;
}

/**
 * When the backend adds incorporation columns, flip this flag and the same
 * form will begin sending them. Until then, fields render and validate but are
 * dropped on submit.
 */
export const SUBMIT_INCORPORATION_FIELDS = false;

export const EMPTY_STUDIO_FORM_STATE: StudioFormState = {
  name: '',
  email: '',
  description: '',
  teamSize: null,
  groupUrl: '',
  website: '',
  atsLink: '',
  experiences: [null, null, null, null, null],
  legalBusinessName: '',
  countryOfIncorporation: '',
  stateOfIncorporation: '',
};

function trimmedTopExperienceUniverseIds(state: StudioFormState): Array<number> | null {
  const ids = state.experiences.filter((id): id is number => id != null);
  if (ids.length === 0) {
    return null;
  }
  return ids;
}

export function toCreateStudioRequest(state: StudioFormState): CreateStudioRequest {
  const parsed = parseGroupUrl(state.groupUrl);
  if (!parsed.ok) {
    throw new Error(
      'toCreateStudioRequest: groupUrl must be a valid Roblox group URL or numeric group id',
    );
  }
  if (state.teamSize === null) {
    throw new Error('toCreateStudioRequest: teamSize must be set before submit');
  }

  const base: CreateStudioRequest = {
    name: state.name.trim(),
    email: state.email.trim(),
    description: state.description.trim(),
    teamSize: state.teamSize,
    groupId: parsed.groupId,
    website: state.website.trim() || null,
    topExperienceUniverseIds: trimmedTopExperienceUniverseIds(state),
  };

  if (SUBMIT_INCORPORATION_FIELDS) {
    const extended: CreateStudioRequestWithIncorporation = {
      ...base,
      legalBusinessName: state.legalBusinessName.trim(),
      countryOfIncorporation: state.countryOfIncorporation,
      stateOfIncorporation: state.stateOfIncorporation.trim(),
    };
    return extended;
  }

  return base;
}

export function toUpdateStudioRequest(state: StudioFormState): UpdateStudioRequest {
  if (state.teamSize === null) {
    throw new Error('toUpdateStudioRequest: teamSize must be set before submit');
  }

  const base: UpdateStudioRequest = {
    name: state.name.trim(),
    email: state.email.trim(),
    description: state.description.trim(),
    teamSize: state.teamSize,
    website: state.website.trim() || null,
    atsLink: state.atsLink.trim() || null,
    topExperienceUniverseIds: trimmedTopExperienceUniverseIds(state),
  };

  if (SUBMIT_INCORPORATION_FIELDS) {
    const extended: UpdateStudioRequestWithIncorporation = {
      ...base,
      legalBusinessName: state.legalBusinessName.trim(),
      countryOfIncorporation: state.countryOfIncorporation,
      stateOfIncorporation: state.stateOfIncorporation.trim(),
    };
    return extended;
  }

  return base;
}
