import { ProgressCircleLoader } from '@modules/monetization-shared/loaders';
import PassesActionBarV2 from './PassesActionBarV2';

type Props = {
  /** Keeps the Current/Archived chips reachable while the first page loads. */
  isArchiveEnabled?: boolean;
};

/**
 * Initial-load view for the Game Passes table.
 *
 * TODO(jeminpark): replace the spinner with skeleton rows so switching views does not
 * collapse the table; `managed-pricing/manage-items/components/ManagedProductsTableSkeleton`
 * is the pattern to follow.
 */
function PassesTableLoading({ isArchiveEnabled }: Props) {
  if (!isArchiveEnabled) {
    return <ProgressCircleLoader />;
  }

  return (
    <>
      <PassesActionBarV2
        className='margin-bottom-medium'
        isArchiveEnabled
        disableSearch
        hideBulkAction
      />
      <ProgressCircleLoader />
    </>
  );
}

export default PassesTableLoading;
