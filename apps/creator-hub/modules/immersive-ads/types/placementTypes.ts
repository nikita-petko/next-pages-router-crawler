import type { Placement as ApiPlacement } from '@rbx/client-developer-ads-stats-api/v1';

export interface Placement {
  id: number;
  type: number;
  name: string;
  universeId: number;
  defaultPlacement: boolean;
  createdTimestampMs: number;
  updatedTimestampMs: number;
}

export function normalizePlacements(apiPlacements: ApiPlacement[]): Placement[] {
  return apiPlacements.map((placement) => ({
    id: placement.id ?? 0,
    type: placement.type ?? 0,
    name: placement.name ?? '',
    universeId: placement.universeId ?? 0,
    defaultPlacement: placement.defaultPlacement ?? false,
    createdTimestampMs: placement.createdTimestampMs ?? 0,
    updatedTimestampMs: placement.updatedTimestampMs ?? 0,
  }));
}
