import type { HttpControllerGetNotApprovedResponseViolation } from '@rbx/client-behavior-intervention/v1';
import {
  isPlatformElementValid,
  isPlatformEvidence,
  isValidatedPlatformEvidence,
} from './platformEvidenceTypes';

/**
 * Determines whether to render violation instead of bad utterances. Frontend
 * will always err on the side of violation, so that rollout can be controlled
 * by BIS.
 */
const isPlatformEvidenceVisibleInView = (
  violation?: HttpControllerGetNotApprovedResponseViolation,
) => {
  // Only display violation if it exists in the response from BIS and is well-formed
  if (!violation) {
    return false;
  }

  // Only display violation if:
  // * Violation contains list-type platform evidence
  // * The platform evidence is valid
  const evidence = violation?.evidence;
  if (!evidence || !isPlatformEvidence(evidence)) {
    return false;
  }

  const visibleElements = evidence.elements?.filter((element) => {
    return isPlatformElementValid(element);
  });
  if (!visibleElements || visibleElements.length === 0) {
    // Only display violation if there are some evidence elements to display
    return false;
  }

  // This check should always pass but is needed to ensure evidence can be treated like PlatformEvidenceFullyTyped
  return isValidatedPlatformEvidence({
    ...evidence,
    elements: visibleElements,
  });
};

export default isPlatformEvidenceVisibleInView;
