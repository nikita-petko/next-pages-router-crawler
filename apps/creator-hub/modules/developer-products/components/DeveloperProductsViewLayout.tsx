import type { ReactNode } from 'react';
import { useIsDeveloperProductsBulkActionPending } from '../hooks/useIsDeveloperProductsBulkActionPending';
import DeveloperProductsViewChips from './DeveloperProductsViewChips';

type Props = {
  universeId: number;
  /** When false/undefined the archive flag is off and no chips render. */
  isArchiveEnabled?: boolean;
  children: ReactNode;
};

/**
 * Holds the Current/Archived chips above whichever list state is showing, so the toggle
 * stays put while the content beneath it swaps between loading, empty, and the table.
 */
function DeveloperProductsViewLayout({ universeId, isArchiveEnabled, children }: Props) {
  const isBulkActionPending = useIsDeveloperProductsBulkActionPending(universeId);

  if (!isArchiveEnabled) {
    return children;
  }

  return (
    <div className='flex flex-col gap-xxlarge'>
      <DeveloperProductsViewChips disabled={isBulkActionPending} />
      {children}
    </div>
  );
}

export default DeveloperProductsViewLayout;
