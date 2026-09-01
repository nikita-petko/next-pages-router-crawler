import type { AgreementContentReference } from '@rbx/client-content-licensing-api/v1';
import { ContentType } from '@rbx/client-content-licensing-api/v1';

interface BuildApplyToLicenseTargetsParams {
  universeId?: number;
}

/** Builds apply-to-license agreement content targets from an experience selection. */
export function buildApplyToLicenseTargets({
  universeId,
}: BuildApplyToLicenseTargetsParams): AgreementContentReference[] {
  if (universeId != null) {
    return [
      {
        contentId: String(universeId),
        contentType: ContentType.Universe,
      },
    ];
  }

  return [];
}
