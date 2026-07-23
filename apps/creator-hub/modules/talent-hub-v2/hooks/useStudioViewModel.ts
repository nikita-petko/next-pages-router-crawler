import { useMemo } from 'react';
import { API_TEAM_SIZE_LABELS } from '../constants';
import type { Studio, StudioViewModel } from '../types';
import { getEnumLabel } from '../utils';

export function toStudioViewModel(studio: Studio): StudioViewModel {
  const raw = studio as Studio & { group?: string | null };
  return {
    id: raw.id ?? '',
    name: raw.name ?? 'Studio',
    logo: raw.logo ?? undefined,
    email: raw.email ?? undefined,
    description: raw.description ?? '',
    teamSize: raw.teamSize ?? undefined,
    teamSizeLabel: getEnumLabel(API_TEAM_SIZE_LABELS, raw.teamSize as number, 'Team size'),
    location: raw.location ?? undefined,
    group: raw.group ?? undefined,
    groupId: raw.groupId ?? undefined,
    website: raw.website ?? undefined,
    socialLinks: raw.socialLinks ?? undefined,
    atsLink: raw.atsLink ?? undefined,
    topExperienceUniverseIds: raw.topExperienceUniverseIds ?? undefined,
    createdAt: raw.createdAt ?? new Date(),
  };
}

export function useStudioViewModel(studio: Studio | undefined): StudioViewModel | undefined {
  return useMemo(() => (studio ? toStudioViewModel(studio) : undefined), [studio]);
}

export function useStudiosViewModel(studios: Studio[] = []): StudioViewModel[] {
  return useMemo(() => studios.map(toStudioViewModel), [studios]);
}
