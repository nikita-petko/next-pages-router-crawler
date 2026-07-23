import type { ContentModerationStatus } from '@rbx/client-ads-management-api/v1';

type AssetStatusBadgeProps = {
  contentModerationStatus: ContentModerationStatus;
  isArchived: boolean;
  label: string;
};

export const getAssetStatusDotColorClass = (
  isArchived: boolean,
  contentModerationStatus: ContentModerationStatus,
): string => {
  if (isArchived) {
    return 'bg-system-neutral';
  }
  switch (contentModerationStatus) {
    case 'approved':
      return 'bg-system-success';
    case 'pending_review':
      return 'bg-system-warning';
    case 'rejected':
      return 'bg-system-alert';
    default:
      return 'bg-system-neutral';
  }
};

/**
 * Figma StatusBadge (8px dot + caption on a subtle backplate). Foundation
 * StatusBadge is not exported from @rbx/foundation-ui yet — mirror its layout
 * with design tokens until the primitive ships.
 * TODO(ADS): Replace this component with Foundation `StatusBadge` once it is
 * exported from `@rbx/foundation-ui`.
 */
const AssetStatusBadge = ({
  contentModerationStatus,
  isArchived,
  label,
}: AssetStatusBadgeProps) => (
  <span className='inline-flex items-center gap-xsmall radius-small clip bg-shift-300 padding-x-[var(--size-250)] padding-y-[var(--size-150)]'>
    <span
      aria-hidden
      className={`shrink-0 size-[8px] radius-circle ${getAssetStatusDotColorClass(isArchived, contentModerationStatus)}`}
    />
    <span className='text-body-small content-emphasis text-no-wrap'>{label}</span>
  </span>
);

export default AssetStatusBadge;
