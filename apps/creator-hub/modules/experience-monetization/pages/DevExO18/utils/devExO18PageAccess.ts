import type { ResolvedUniversePermissionsResponse } from '@rbx/client-organizations-service-api/v1';

export type DevExO18ExperienceOption = {
  universeId: number;
  name: string;
};

type DevExO18LandingPagePermissions = Pick<
  ResolvedUniversePermissionsResponse,
  'monetizeExperience' | 'viewAnalytics'
>;

export function canAccessDevExO18LandingPage(
  permissions: DevExO18LandingPagePermissions | undefined,
): boolean {
  return permissions?.monetizeExperience === true || permissions?.viewAnalytics === true;
}

export function parseUniverseIdQueryParam(
  value: string | string[] | undefined | null,
): number | undefined {
  const raw = value == null ? undefined : Array.isArray(value) ? value[0] : value;
  if (typeof raw !== 'string') {
    return undefined;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }
  return parsed;
}

export function resolveSelectedUniverseId(
  options: DevExO18ExperienceOption[],
  queryUniverseId: number | undefined,
): number | undefined {
  if (options.length === 0) {
    return undefined;
  }
  if (queryUniverseId != null && options.some((option) => option.universeId === queryUniverseId)) {
    return queryUniverseId;
  }
  return options[0]?.universeId;
}
