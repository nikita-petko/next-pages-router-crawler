/* oxlint-disable react/react-compiler -- mutation callbacks require exhaustive dependencies; compiler flags those stable mutation refs as extra */
import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { withManagedPricingSubmitGuard } from '@modules/managed-pricing/dialogs/withManagedPricingSubmitGuard';
import type { ManagedPricingOnboardingStatus } from '@modules/managed-pricing/types';
import {
  openRequestErrorDialog,
  openPartialFailuresDialog,
} from '@modules/monetization-shared/error-dialogs';
import { pluralize } from '@modules/monetization-shared/pluralize';
import { toast } from '@modules/monetization-shared/snackbar/actions';
import {
  TableSelectionProvider,
  useTableSelectionStoreInstance,
} from '@modules/monetization-shared/table-selection/context';
import {
  useSelectionStats,
  type BulkToggleAction,
} from '@modules/monetization-shared/table-selection/hooks';
import { useSortItems } from '@modules/monetization-shared/table-sort/useSortItems';
import TableControls from '@modules/monetization-shared/table-v1/TableControls';
import type { TTableControlsProps } from '@modules/monetization-shared/table-v1/TableControls';
import { useCurrentPage } from '@modules/monetization-shared/table-v1/useCurrentPage';
import { useTablePagination } from '@modules/monetization-shared/table-v1/useTablePagination';
import { useTokenizedSearch } from '@modules/monetization-shared/useTokenizedSearch';
import { useBatchUpdateGamePassesManagedPricing } from '../queries/useBatchUpdateGamePassesManagedPricing';
import type { GamePass } from '../types';
import { sortPasses } from '../utils/sortPasses';
import PassesActionBarV2 from './PassesActionBarV2';
import PassesTableBase from './PassesTableBase';
import PassesTableRow from './PassesTableRow';

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];
const DEFAULT_ROWS_PER_PAGE = ROWS_PER_PAGE_OPTIONS[2]; // 50
const SEARCH_FIELDS = ['name', 'passId'] as const satisfies readonly (keyof GamePass)[];

const getPassId = (pass: GamePass) => pass.passId;
const isPassSelectable = (pass: GamePass): boolean | string =>
  pass.isSelectableForManagedPricing || 'NotEligible';

type Props = {
  universeId: number;
  passes: GamePass[];
  showArchived?: boolean;
  managedPricingOnboardingStatus?: ManagedPricingOnboardingStatus;
  initialRowsPerPage?: number;
  rowsPerPageOptions?: number[];
  /** Renders the Current/Archived chips and switches the table to the archived layout. */
  isArchiveEnabled?: boolean;
};

function PassesTableControls(props: Omit<TTableControlsProps, 'numSelected' | 'maxSelectable'>) {
  const { numSelected } = useSelectionStats();
  return <TableControls numSelected={numSelected} {...props} />;
}

function PassesTable({
  universeId,
  passes,
  showArchived,
  managedPricingOnboardingStatus,
  initialRowsPerPage = DEFAULT_ROWS_PER_PAGE,
  rowsPerPageOptions = ROWS_PER_PAGE_OPTIONS,
  isArchiveEnabled,
}: Props) {
  const { translate } = useTranslation();

  const {
    searchQuery,
    setSearchQuery,
    results: searchedPasses,
  } = useTokenizedSearch(passes, SEARCH_FIELDS);

  const { page, rowsPerPage, onPageChange, onRowsPerPageChange } = useTablePagination({
    initialRowsPerPage,
    count: searchedPasses.length,
  });

  const { sortedItems, sortColumn, sortOrder, onSort } = useSortItems(searchedPasses, {
    sort: sortPasses,
  });

  const { currentPage } = useCurrentPage(sortedItems, { page, rowsPerPage });

  const [isBulkUpdatePending, setIsBulkUpdatePending] = useState(false);

  const selectionStore = useTableSelectionStoreInstance(
    {
      identifier: getPassId,
      selectable: isPassSelectable,
    },
    {
      currentPage,
      items: searchedPasses,
      mode: 'all',
      disabled: isBulkUpdatePending,
    },
  );

  const { mutateAsync: batchUpdateManagedPricing, isPending: isBatchUpdateManagedPricingPending } =
    useBatchUpdateGamePassesManagedPricing(
      { universeId },
      {
        onPartialFailure: (errors, { passIds }) => {
          if (passIds.length > 1) {
            openPartialFailuresDialog({ count: errors.length });
          } else {
            openRequestErrorDialog();
          }
        },
        onError: () => openRequestErrorDialog(),
      },
    );

  const performBulkUpdateManagedPricing = useCallback(
    async (passIds: number[], enabled: boolean) => {
      setIsBulkUpdatePending(true);
      try {
        const { errors } = await batchUpdateManagedPricing(
          { passIds, enabled },
          { onSuccess: selectionStore.reset },
        );

        const successCount = passIds.length - (errors?.length ?? 0);
        if (successCount > 0) {
          const message = pluralize(
            successCount,
            translate('Message.SuccessfullyUpdatedSingleGamePass'),
            translate('Message.SuccessfullyUpdatedMultipleGamePasses', {
              count: successCount.toString(),
            }),
          );
          toast({ title: message });
        }
      } finally {
        setIsBulkUpdatePending(false);
      }
    },
    [batchUpdateManagedPricing, selectionStore, translate],
  );

  const handleBulkToggleManagedPricing = useCallback(
    (action: Exclude<BulkToggleAction, 'none'>) => {
      const selectedPasses = selectionStore.getSelectedViewableItems();
      const passIds = selectedPasses.map(getPassId);

      /* istanbul ignore if -- guarding for completeness */
      if (selectedPasses.length === 0) {
        return;
      }

      const targetStatus = action === 'enabling';
      void withManagedPricingSubmitGuard({
        universeId,
        targetStatus,
        onboardingStatus: managedPricingOnboardingStatus,
        count: passIds.length,
        onConfirm: () => performBulkUpdateManagedPricing(passIds, targetStatus),
      });
    },
    [managedPricingOnboardingStatus, performBulkUpdateManagedPricing, selectionStore, universeId],
  );

  const rows = useMemo(
    () =>
      currentPage.map((pass) => (
        <PassesTableRow
          key={pass.passId}
          universeId={universeId}
          showArchived={showArchived}
          {...pass}
        />
      )),
    [currentPage, universeId, showArchived],
  );

  return (
    <TableSelectionProvider store={selectionStore}>
      <section>
        {showArchived && (
          <PassesActionBarV2
            className='margin-bottom-medium'
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            isArchiveEnabled={isArchiveEnabled}
            hideBulkAction
          />
        )}

        {!showArchived && (
          <PassesActionBarV2
            // The chips row above supplies the gap once archiving is on.
            className={
              isArchiveEnabled ? 'margin-bottom-medium' : 'margin-bottom-medium padding-top-small'
            }
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            isArchiveEnabled={isArchiveEnabled}
            onBulkAction={handleBulkToggleManagedPricing}
            isBulkActionDisabled={isBatchUpdateManagedPricingPending}
            isBulkActionPending={isBulkUpdatePending}
          />
        )}

        <PassesTableBase
          showArchived={showArchived}
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={onSort}>
          {rows}
        </PassesTableBase>

        <PassesTableControls
          rowsPerPageOptions={rowsPerPageOptions}
          count={searchedPasses.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
          className='padding-y-small'
        />
      </section>
    </TableSelectionProvider>
  );
}

export default PassesTable;
