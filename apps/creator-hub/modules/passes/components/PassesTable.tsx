/* oxlint-disable react/react-compiler -- mutation callbacks require exhaustive dependencies; compiler flags those stable mutation refs as extra */
import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { withManagedPricingSubmitGuard } from '@modules/managed-pricing/dialogs/withManagedPricingSubmitGuard';
import { isManagedPricingAvailable } from '@modules/managed-pricing/hooks/useIsManagedPricingAvailable';
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
import { useSimpleDialog } from '@modules/monetization-shared/useSimpleDialog';
import { useTokenizedSearch } from '@modules/monetization-shared/useTokenizedSearch';
import RegionalPricingDisclaimerModal, {
  useRegionalPricingDisclaimer,
} from '@modules/regional-pricing/components/RegionalPricingDisclaimerModal/RegionalPricingDisclaimerModal';
import BulkDisableRegionalPricingDialog from '@modules/regional-pricing/dialogs/BulkDisableRegionalPricingDialog';
import BulkEnableRegionalPricingDialog from '@modules/regional-pricing/dialogs/BulkEnableRegionalPricingDialog';
import { useBatchUpdateGamePassesManagedPricing } from '../queries/useBatchUpdateGamePassesManagedPricing';
import { useBulkUpdateRegionalPricingForPasses } from '../queries/useBulkUpdateRegionalPricingForPasses';
import type { GamePass } from '../types';
import { isPassEligibleForRegionalPricing } from '../utils/passesUtils';
import { sortPasses } from '../utils/sortPasses';
import PassesActionBar from './PassesActionBar';
import PassesActionBarV2 from './PassesActionBarV2';
import PassesTableBase from './PassesTableBase';
import PassesTableRow from './PassesTableRow';

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];
const DEFAULT_ROWS_PER_PAGE = ROWS_PER_PAGE_OPTIONS[2]; // 50
const SEARCH_FIELDS = ['name', 'passId'] as const satisfies readonly (keyof GamePass)[];

const getPassId = (pass: GamePass) => pass.passId;
const isPassSelectable = (pass: GamePass): boolean | string =>
  isPassEligibleForRegionalPricing(pass) || pass.isSelectableForManagedPricing || 'NotEligible';

type Props = {
  universeId: number;
  passes: GamePass[];
  showPriceOptimization?: boolean;
  managedPricingOnboardingStatus?: ManagedPricingOnboardingStatus;
  initialRowsPerPage?: number;
  rowsPerPageOptions?: number[];
};

function PassesTableControls(props: Omit<TTableControlsProps, 'numSelected' | 'maxSelectable'>) {
  const { numSelected } = useSelectionStats();
  return <TableControls numSelected={numSelected} {...props} />;
}

// TODO(jeminpark): this is a minor optimization to subscribe bulk dialogs to the selection store,
// should migrate to action-based dialog with foundation when we integrate managed pricing.
function BulkEnableDialogMessage() {
  const { translate } = useTranslation();
  const { numSelected } = useSelectionStats();

  return (
    <>
      {pluralize(
        numSelected,
        translate('Message.EnableSinglePassForRegionalPricing'),
        translate('Message.EnableMultiplePassesForRegionalPricing', {
          number: numSelected.toString(),
        }),
      )}
    </>
  );
}

function PassesTable({
  universeId,
  passes,
  showPriceOptimization = false,
  managedPricingOnboardingStatus,
  initialRowsPerPage = DEFAULT_ROWS_PER_PAGE,
  rowsPerPageOptions = ROWS_PER_PAGE_OPTIONS,
}: Props) {
  const { translate } = useTranslation();

  const showManagedPricing = isManagedPricingAvailable(managedPricingOnboardingStatus);

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

  const bulkEnableRegionalPricingDialog = useSimpleDialog();
  const bulkDisableRegionalPricingDialog = useSimpleDialog();

  const { mutateAsync: bulkUpdateRegionalPricing, isPending: isBulkUpdateRegionalPricingPending } =
    useBulkUpdateRegionalPricingForPasses(
      { universeId },
      {
        onSettled: () => {
          bulkEnableRegionalPricingDialog.close();
          bulkDisableRegionalPricingDialog.close();
        },
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

  const { withDisclaimer: withRegionalPricingDisclaimer } =
    useRegionalPricingDisclaimer(universeId);

  const handleSingleToggleRegionalPricing = useCallback(
    async (passId: number, enabled: boolean) => {
      await withRegionalPricingDisclaimer(
        () =>
          bulkUpdateRegionalPricing(
            { passIds: [passId], enabled },
            {
              onSuccess: ({ errors }) => {
                if (!errors?.length) {
                  toast({ title: translate('Message.SuccessfullyUpdatedGamePass') });
                }
              },
            },
          ).catch(() => {}),
        { enabled },
      );
    },
    [withRegionalPricingDisclaimer, bulkUpdateRegionalPricing, translate],
  );

  const handleBulkToggleRegionalPricing = useCallback(
    async (enabled: boolean) => {
      const selectedPasses = selectionStore.getSelectedViewableItems();
      const passIds = selectedPasses.map(getPassId);
      /* istanbul ignore if -- guarding for completeness */
      if (selectedPasses.length === 0) {
        return;
      }

      setIsBulkUpdatePending(true);
      try {
        const { errors } = await bulkUpdateRegionalPricing(
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
    [selectionStore, bulkUpdateRegionalPricing, translate],
  );

  const handleBulkEnableRegionalPricing = useCallback(
    () => handleBulkToggleRegionalPricing(true),
    [handleBulkToggleRegionalPricing],
  );

  const handleBulkDisableRegionalPricing = useCallback(
    () => handleBulkToggleRegionalPricing(false),
    [handleBulkToggleRegionalPricing],
  );

  const handleClickRegionalPricingBulkEnable = useCallback(() => {
    void withRegionalPricingDisclaimer(bulkEnableRegionalPricingDialog.open);
  }, [withRegionalPricingDisclaimer, bulkEnableRegionalPricingDialog.open]);

  const handleBulkAction = useCallback(
    (action: Exclude<BulkToggleAction, 'none'>) => {
      const callback =
        action === 'enabling'
          ? handleClickRegionalPricingBulkEnable
          : bulkDisableRegionalPricingDialog.open;

      callback();
    },
    [handleClickRegionalPricingBulkEnable, bulkDisableRegionalPricingDialog.open],
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
          showManagedPricing={showManagedPricing}
          showPriceOptimization={showPriceOptimization}
          onToggleRegionalPricing={handleSingleToggleRegionalPricing}
          disableToggleRegionalPricing={isBulkUpdatePending}
          {...pass}
        />
      )),
    [
      currentPage,
      universeId,
      showManagedPricing,
      showPriceOptimization,
      handleSingleToggleRegionalPricing,
      isBulkUpdatePending,
    ],
  );

  return (
    <TableSelectionProvider store={selectionStore}>
      <section>
        {showManagedPricing ? (
          <PassesActionBarV2
            // Note: padding top is to offset analytics layout - remove after migrating
            className='margin-bottom-medium padding-top-small'
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onBulkAction={handleBulkToggleManagedPricing}
            isBulkActionDisabled={isBatchUpdateManagedPricingPending}
            isBulkActionPending={isBulkUpdatePending}
          />
        ) : (
          <PassesActionBar
            className='margin-top-[8px]'
            universeId={universeId}
            onBulkAction={handleBulkAction}
            isBulkActionDisabled={isBulkUpdateRegionalPricingPending}
            isBulkActionPending={isBulkUpdatePending}
          />
        )}

        {!showManagedPricing && (
          <PassesTableControls
            rowsPerPageOptions={rowsPerPageOptions}
            count={searchedPasses.length}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={onPageChange}
            onRowsPerPageChange={onRowsPerPageChange}
            className='padding-y-small'
          />
        )}

        <PassesTableBase
          showPriceOptimization={showPriceOptimization}
          showManagedPricing={showManagedPricing}
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

      {!showManagedPricing && <RegionalPricingDisclaimerModal universeId={universeId} />}

      {!showManagedPricing && (
        <BulkEnableRegionalPricingDialog
          isOpen={bulkEnableRegionalPricingDialog.isOpen}
          onClose={bulkEnableRegionalPricingDialog.close}
          onConfirm={handleBulkEnableRegionalPricing}
          disabled={isBulkUpdateRegionalPricingPending}
          loading={isBulkUpdatePending}>
          <BulkEnableDialogMessage />
        </BulkEnableRegionalPricingDialog>
      )}

      {!showManagedPricing && (
        <BulkDisableRegionalPricingDialog
          isOpen={bulkDisableRegionalPricingDialog.isOpen}
          onClose={bulkDisableRegionalPricingDialog.close}
          onConfirm={handleBulkDisableRegionalPricing}
          disabled={isBulkUpdateRegionalPricingPending}
          loading={isBulkUpdatePending}
        />
      )}
    </TableSelectionProvider>
  );
}

export default PassesTable;
