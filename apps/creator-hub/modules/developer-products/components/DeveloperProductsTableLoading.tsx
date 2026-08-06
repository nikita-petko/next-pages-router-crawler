import { ProgressCircleLoader } from '@modules/monetization-shared/loaders';
import DeveloperProductsActionBarV2 from './DeveloperProductsActionBarV2';

type Props = {
  /** Keeps the Current/Archived chips reachable while the first page loads. */
  isArchiveEnabled?: boolean;
};

/**
 * Initial-load view for the Developer Products table.
 *
 * TODO(jeminpark): replace the spinner with skeleton rows so switching views does not
 * collapse the table; `managed-pricing/manage-items/components/ManagedProductsTableSkeleton`
 * is the pattern to follow.
 */
function DeveloperProductsTableLoading({ isArchiveEnabled }: Props) {
  if (!isArchiveEnabled) {
    return <ProgressCircleLoader />;
  }

  return (
    <>
      <DeveloperProductsActionBarV2
        className='margin-bottom-medium'
        isArchiveEnabled
        disableSearch
        hideBulkAction
      />
      <ProgressCircleLoader />
    </>
  );
}

export default DeveloperProductsTableLoading;
