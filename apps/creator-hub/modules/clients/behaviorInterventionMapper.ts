import type { DevExInterventionDetail } from './userModerationTypes';

export type NotApprovedJson = {
  interventionId?: string;
  intervention_id?: string;
  acknowledgeable?: boolean;
  punishmentTypeDescription?: string;
  endDate?: string | Date;
  consequenceTransparencyMessage?: string;
  badUtterances?: DevExInterventionDetail['badUtterances'];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function extractInterventionId(raw: Record<string, unknown>): string | undefined {
  for (const key of ['interventionId', 'intervention_id'] as const) {
    const value = raw[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function normalizeEndDate(value: unknown): string | undefined {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value.toISOString();
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : value;
  }

  return undefined;
}

function normalizeBadUtterances(
  value: unknown,
): DevExInterventionDetail['badUtterances'] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.flatMap((item) => {
    if (!isRecord(item)) {
      return [];
    }

    const labelTranslationKey = item.labelTranslationKey;
    return [
      {
        labelTranslationKey:
          typeof labelTranslationKey === 'string' ? labelTranslationKey : undefined,
      },
    ];
  });
}

export function isNotApprovedJson(value: unknown): value is NotApprovedJson {
  if (!isRecord(value)) {
    return false;
  }

  if (
    'interventionId' in value &&
    value.interventionId !== undefined &&
    typeof value.interventionId !== 'string'
  ) {
    return false;
  }

  if (
    'intervention_id' in value &&
    value.intervention_id !== undefined &&
    typeof value.intervention_id !== 'string'
  ) {
    return false;
  }

  return true;
}

export function mapNotApprovedResponseToDevExIntervention(
  raw: unknown,
): DevExInterventionDetail | null {
  if (!isRecord(raw)) {
    return null;
  }

  const interventionId = extractInterventionId(raw);
  if (!interventionId) {
    return null;
  }

  const acknowledgeable = raw.acknowledgeable;
  const punishmentTypeDescription = raw.punishmentTypeDescription;

  return {
    interventionId,
    acknowledgeable: acknowledgeable !== false,
    punishmentTypeDescription:
      typeof punishmentTypeDescription === 'string' ? punishmentTypeDescription : undefined,
    endDate: normalizeEndDate(raw.endDate),
    consequenceTransparencyMessage:
      typeof raw.consequenceTransparencyMessage === 'string'
        ? raw.consequenceTransparencyMessage
        : undefined,
    badUtterances: normalizeBadUtterances(raw.badUtterances),
  };
}

/** Prefer hook state, then page-load prefetch, for intervention acknowledgement. */
export function pickEffectiveDevExIntervention(
  intervention: DevExInterventionDetail | null,
  pageLoadIntervention: DevExInterventionDetail | null,
): DevExInterventionDetail | null {
  if (intervention?.interventionId) {
    return intervention;
  }

  if (pageLoadIntervention?.interventionId) {
    return pageLoadIntervention;
  }

  return intervention ?? pageLoadIntervention;
}
