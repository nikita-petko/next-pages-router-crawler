import { z } from 'zod';
import { HttpControllerGetNotApprovedResponseViolationEvidence } from '@rbx/client-behavior-intervention/v1';

// This code is adapted from Appeals Portal web-frontend code: https://github.rbx.com/Roblox/web-frontend/blob/853c9ff97d5bc8b62360da3320aa3158ee9a7afc/WebApps/Roblox.ModerationPortal.WebApp/Roblox.ModerationPortal.WebApp/ts/react/api/types.ts

/**
 * Known values for `violation.evidence.type`.
 */
export enum EvidenceType {
  PLATFORM = 'platform',
}

/**
 * This represents the supported evidence content for a platform violation.
 * Elements are validated separately.
 */
const zPlatformEvidence = z.object({
  type: z.literal(EvidenceType.PLATFORM),
  displayMeta: z.optional(
    z.object({
      lowercaseKey: z.string().min(1),
      capitalizedKey: z.string().min(1),
      icon: z.string(),
    }),
  ),
  /** We handle this verification separately in `zPlatformElement` */
  elements: z.optional(z.array(z.unknown())),
});

/**
 * This represent the supported evidence content for a platform violation.
 */
export type PlatformEvidence = z.infer<typeof zPlatformEvidence>;

/**
 * Evidence is partly typed, and we'll use this to almost fully type it for PLATFORM evidence if
 * it passed our validation check. It doesn't validate individual elements.
 */
export const isPlatformEvidence = (
  evidence: HttpControllerGetNotApprovedResponseViolationEvidence,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore For reasons, the lint/test runs TS from the base folder, which is incompatible with zod
): evidence is PlatformEvidence => {
  if (!evidence || evidence.type !== EvidenceType.PLATFORM) {
    // we only care about PLATFORM evidence
    // other types will have to implement their own type guards
    return false;
  }
  const result = zPlatformEvidence.safeParse(evidence);
  if (!result.success) {
    // eslint-disable-next-line no-console
    console.warn('Failed to parse platform evidence: ', result.error);
    return false;
  }
  return true;
};

export const zPlatformElement = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('text'),
    labelKey: z.string(),
    text: z.string(),
  }),
  z.object({
    type: z.literal('image'),
    labelKey: z.string(),
    url: z.string(),
    altLabelKey: z.optional(z.string()),
  }),
]);

/**
 * This represents a supported element in platform evidence.
 */
export type PlatformElement = z.infer<typeof zPlatformElement>;

/**
 * Checks if an element provided as part of platform evidence follows the expected schema.
 * If not, send an error event, because this signals that an integrator needs to fix the
 * way they provide evidence, or otherwise update the UI.
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const isPlatformElementValid = (element: object): element is PlatformElement => {
  const result = zPlatformElement.safeParse(element);
  if (!result.success) {
    if (process.env.NODE_ENV !== 'test') {
      // eslint-disable-next-line no-console
      console.warn('Failed to parse platform element: ', result.error);
    }
    return false;
  }
  return true;
};

/**
 * This represents fully valid platform evidence, including valid elements.
 */
const zPlatformEvidenceFullyTyped = zPlatformEvidence.merge(
  z.object({
    elements: z.optional(z.array(zPlatformElement)),
  }),
);

/**
 * This represents the supported evidence content for a platform violation (fully typed).
 */
export type PlatformEvidenceFullyTyped = z.infer<typeof zPlatformEvidenceFullyTyped>;

/**
 * Evidence is partly typed, and we'll use this to almost fully type it for PLATFORM evidence if
 * it passed our validation check. It doesn't validate individual elements.
 */
export const isValidatedPlatformEvidence = (
  evidence: HttpControllerGetNotApprovedResponseViolationEvidence,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore For reasons, the lint/test runs TS from the base folder, which is incompatible with zod
): evidence is PlatformEvidenceFullyTyped => {
  if (!evidence || evidence.type !== EvidenceType.PLATFORM) {
    // we only care about PLATFORM evidence
    // other types will have to implement their own type guards
    return false;
  }
  const result = zPlatformEvidenceFullyTyped.safeParse(evidence);
  if (!result.success) {
    // eslint-disable-next-line no-console
    console.warn('Failed to parse platform evidence fully typed: ', result.error);
    return false;
  }
  return true;
};
