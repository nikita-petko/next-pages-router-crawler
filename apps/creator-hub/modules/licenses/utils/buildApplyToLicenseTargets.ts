import type { AgreementContentReference, LicenseType } from '@rbx/client-content-licensing-api/v1';
import { ContentType } from '@rbx/client-content-licensing-api/v1';
import type CreatorType from '@modules/miscellaneous/common/enums/Creator';
import { toCreatorContentType } from './creatorContentType';
import { isAvatarLicenseApplyFlow } from './isAvatarLicenseApplyFlow';

export interface ApplyToLicenseCreator {
  creatorId: number;
  creatorType: CreatorType;
}

interface BuildApplyToLicenseTargetsParams {
  licenseType?: LicenseType;
  universeId?: number;
  applyCreator?: ApplyToLicenseCreator;
}

/** Builds apply-to-license agreement content targets from license type and creator selections. */
export function buildApplyToLicenseTargets({
  licenseType,
  universeId,
  applyCreator,
}: BuildApplyToLicenseTargetsParams): AgreementContentReference[] {
  if (isAvatarLicenseApplyFlow(licenseType) && applyCreator != null) {
    return [
      {
        contentId: String(applyCreator.creatorId),
        contentType: toCreatorContentType(applyCreator.creatorType),
      },
    ];
  }

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
