import type { ContentModerationStatus } from '@rbx/client-ads-management-api/v1';
import { StatusBadge, type TStatusBadgeShape, type TStatusBadgeVariant } from '@rbx/foundation-ui';

type AssetStatusBadgeProps = {
  contentModerationStatus: ContentModerationStatus;
  isArchived: boolean;
  label: string;
  /** `Box` adds a backplate, for the asset details drawer. Tables use the bare default. */
  shape?: TStatusBadgeShape;
};

const getAssetStatusBadgeVariant = (
  isArchived: boolean,
  contentModerationStatus: ContentModerationStatus,
): TStatusBadgeVariant => {
  if (isArchived) {
    return 'Standard';
  }
  switch (contentModerationStatus) {
    case 'approved':
      return 'Success';
    case 'pending_review':
      return 'Warning';
    case 'rejected':
      return 'Alert';
    default:
      return 'Standard';
  }
};

const AssetStatusBadge = ({
  contentModerationStatus,
  isArchived,
  label,
  shape,
}: AssetStatusBadgeProps) => (
  <StatusBadge
    label={label}
    shape={shape}
    variant={getAssetStatusBadgeVariant(isArchived, contentModerationStatus)}
  />
);

export default AssetStatusBadge;
