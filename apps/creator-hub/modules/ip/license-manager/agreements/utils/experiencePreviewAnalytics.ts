import type { AgreementCandidateResponse } from '@rbx/client-content-licensing-api/v1';
import type { LicenseManagerClickEvent, LicenseManagerImpressionEvent } from '../../utils/logger';

/**
 * Base parameters attached to every Experience Preview analytics event so the
 * "IP Licensing Platform > Experience Preview Analytics" dashboard can group/join on a consistent
 * set of identifiers regardless of which surface emitted the event. Values are flat primitives; the
 * license-manager logger snake_cases keys and stringifies values on emit.
 */
export type ExperiencePreviewAnalyticsContext = {
  agreementCandidateId: string;
  accountId: string;
  ipFamilyId: string;
};

export const getExperiencePreviewAnalyticsContext = (
  candidate: Pick<AgreementCandidateResponse, 'id' | 'accountId' | 'ipFamilyId'>,
): ExperiencePreviewAnalyticsContext => ({
  agreementCandidateId: candidate.id ?? '',
  accountId: candidate.accountId ?? '',
  ipFamilyId: candidate.ipFamilyId ?? '',
});

/** Stable dedupe key for `logOnce` impressions keyed on the shared context. */
export const serializeExperiencePreviewAnalyticsContext = (
  context: ExperiencePreviewAnalyticsContext,
): string => JSON.stringify(context);

type ExperiencePreviewEventName = LicenseManagerClickEvent | LicenseManagerImpressionEvent;

/**
 * Wraps event parameters with the metrics table identifier and logs to console for local testing.
 * Use this for all Experience Preview events to ensure consistent table tagging and console output.
 */
export const logExperiencePreviewEvent = (
  logFn: (
    eventName: ExperiencePreviewEventName,
    params: Record<string, string | number | boolean | Date>,
    dedupeKey?: string,
  ) => void,
  eventName: ExperiencePreviewEventName,
  params: Record<string, string | number | boolean | Date>,
  dedupeKey?: string,
): void => {
  logFn(eventName, params, dedupeKey);
};
