import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { Button, useSnackbar } from '@rbx/ui';
import BulkEnableRegionalPricingDialog from '@modules/regional-pricing/dialogs/BulkEnableRegionalPricingDialog';
import BulkDisableRegionalPricingDialog from '@modules/regional-pricing/dialogs/BulkDisableRegionalPricingDialog';
import RegionalPricingDisclaimerModal, {
  useRegionalPricingDisclaimer,
} from '@modules/regional-pricing/components/RegionalPricingDisclaimerModal/RegionalPricingDisclaimerModal';
import {
  useErrorDialog,
  GeneralErrorDialog,
  PartialFailuresDialog,
} from '@modules/regional-pricing/dialogs/UpdateErrorDialogs';
import { usePassesRegionalPricingPromotionBanner } from '@modules/regional-pricing/hooks/useRegionalPricingPromotionBanner';
import TableControls from '@modules/monetization-shared/table-v1/TableControls';
import { useCurrentPage } from '@modules/monetization-shared/table-v1/useCurrentPage';
import { useTablePagination } from '@modules/monetization-shared/table-v1/useTablePagination';
import { useSimpleDialog } from '@modules/monetization-shared/useSimpleDialog';
import { useSortItems } from '@modules/monetization-shared/table-sort/useSortItems';
import { useSelectEligiblePasses } from '../hooks/useSelectEligiblePasses';
import { useBulkUpdateRegionalPricingForPasses } from '../queries/useBulkUpdateRegionalPricingForPasses';
import { sortPasses } from '../utils/sortPasses';
import { PassesSelectionProvider } from './PassesSelectionContext';
import PassesTableRow from './PassesTableRow';
import PassesTableBase from './PassesTableBase';
import CreatePassButton from './common/CreatePassButton';
import type { GamePass } from '../types';

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];
const DEFAULT_ROWS_PER_PAGE = ROWS_PER_PAGE_OPTIONS[2]; // 50

function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural;
}

type Props = {
  universeId: number;
  passes: GamePass[];
  showPriceOptimization?: boolean;
  initialRowsPerPage?: number;
  rowsPerPageOptions?: number[];
};

function PassesTable({
  universeId,
  passes,
  showPriceOptimization = false,
  initialRowsPerPage = DEFAULT_ROWS_PER_PAGE,
  rowsPerPageOptions = ROWS_PER_PAGE_OPTIONS,
}: Props) {
  const { translate } = useTranslation();

  const { page, rowsPerPage, onPageChange, onRowsPerPageChange } = useTablePagination({
    initialRowsPerPage,
    count: passes.length,
  });

  const { sortedItems, sortColumn, sortOrder, onSort } = useSortItems(passes, { sort: sortPasses });

  const { currentPage } = useCurrentPage(sortedItems, { page, rowsPerPage });

  const [isBulkUpdatePending, setIsBulkUpdatePending] = useState(false);

  const selection = useSelectEligiblePasses({
    items: passes,
    disabled: isBulkUpdatePending,
  });

  const { close: closeRegionalPricingPromoBanner } =
    usePassesRegionalPricingPromotionBanner(universeId);

  const { openErrorDialog, closeErrorDialog } = useErrorDialog();

  const bulkEnableRegionalPricingDialog = useSimpleDialog();
  const bulkDisableRegionalPricingDialog = useSimpleDialog();

  const { enqueue } = useSnackbar();
  const toast = useCallback(
    (message: string) => enqueue({ message, autoHide: true }, (reason) => reason === 'timeout'),
    [enqueue],
  );

  const { mutateAsync: bulkUpdateRegionalPricing, isPending } =
    useBulkUpdateRegionalPricingForPasses(
      { universeId },
      {
        onSettled: () => {
          bulkEnableRegionalPricingDialog.close();
          bulkDisableRegionalPricingDialog.close();
        },
        onPartialFailure: (errors, { passIds }) =>
          openErrorDialog(
            passIds.length > 1 ? (
              <PartialFailuresDialog count={errors.length} onClose={closeErrorDialog} />
            ) : (
              <GeneralErrorDialog onClose={closeErrorDialog} />
            ),
            { fullWidth: true },
          ),
        onError: () =>
          openErrorDialog(<GeneralErrorDialog onClose={closeErrorDialog} />, { fullWidth: true }),
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
                  toast(translate('Message.SuccessfullyUpdatedGamePass'));
                }
              },
            },
          ).catch(() => {}),
        { enabled },
      );
    },
    [withRegionalPricingDisclaimer, bulkUpdateRegionalPricing, toast, translate],
  );

  const handleBulkToggleRegionalPricing = useCallback(
    async (enabled: boolean) => {
      const passIds = Array.from(selection.selectedPasses.keys());
      if (passIds.length === 0) {
        return;
      }

      setIsBulkUpdatePending(true);
      try {
        const { errors } = await bulkUpdateRegionalPricing(
          { passIds, enabled },
          { onSuccess: selection.resetSelection },
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
          toast(message);
        }

        if (enabled && successCount === selection.numSelectable) {
          closeRegionalPricingPromoBanner();
        }
      } finally {
        setIsBulkUpdatePending(false);
      }
    },
    [
      selection.selectedPasses,
      selection.numSelectable,
      selection.resetSelection,
      bulkUpdateRegionalPricing,
      translate,
      toast,
      closeRegionalPricingPromoBanner,
    ],
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
    withRegionalPricingDisclaimer(bulkEnableRegionalPricingDialog.open);
  }, [withRegionalPricingDisclaimer, bulkEnableRegionalPricingDialog.open]);

  const rows = useMemo(
    () =>
      currentPage.map((pass) => (
        <PassesTableRow
          key={pass.passId}
          universeId={universeId}
          showPriceOptimization={showPriceOptimization}
          onToggleRegionalPricing={handleSingleToggleRegionalPricing}
          disableToggleRegionalPricing={isBulkUpdatePending}
          {...pass}
        />
      )),
    [
      currentPage,
      universeId,
      showPriceOptimization,
      handleSingleToggleRegionalPricing,
      isBulkUpdatePending,
    ],
  );

  return (
    <PassesSelectionProvider value={selection}>
      <section>
        <div className='flex justify-start margin-top-[8px] gap-[10px]'>
          {selection.numSelected > 0 ? (
            <Button
              variant='contained'
              size='large'
              color='secondary'
              disabled={isPending}
              loading={isBulkUpdatePending}
              onClick={
                selection.isEnabling
                  ? handleClickRegionalPricingBulkEnable
                  : bulkDisableRegionalPricingDialog.open
              }>
              {selection.isEnabling
                ? translate('Action.EnableRegionalPricing')
                : translate('Action.DisableRegionalPricing')}
            </Button>
          ) : (
            <CreatePassButton universeId={universeId} />
          )}
        </div>

        <TableControls
          numSelected={selection.numSelected}
          rowsPerPageOptions={rowsPerPageOptions}
          count={passes.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
          className='padding-y-small'
        />

        <PassesTableBase
          showPriceOptimization={showPriceOptimization}
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={onSort}>
          {rows}
        </PassesTableBase>

        <TableControls
          numSelected={selection.numSelected}
          rowsPerPageOptions={rowsPerPageOptions}
          count={passes.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
          className='padding-y-small'
        />
      </section>

      <RegionalPricingDisclaimerModal universeId={universeId} />

      <BulkEnableRegionalPricingDialog
        isOpen={bulkEnableRegionalPricingDialog.isOpen}
        onClose={bulkEnableRegionalPricingDialog.close}
        onConfirm={handleBulkEnableRegionalPricing}
        disabled={isPending}
        loading={isBulkUpdatePending}>
        {pluralize(
          selection.numSelected,
          translate('Message.EnableSinglePassForRegionalPricing'),
          translate('Message.EnableMultiplePassesForRegionalPricing', {
            number: selection.numSelected.toString(),
          }),
        )}
      </BulkEnableRegionalPricingDialog>

      <BulkDisableRegionalPricingDialog
        isOpen={bulkDisableRegionalPricingDialog.isOpen}
        onClose={bulkDisableRegionalPricingDialog.close}
        onConfirm={handleBulkDisableRegionalPricing}
        disabled={isPending}
        loading={isBulkUpdatePending}
      />
    </PassesSelectionProvider>
  );
}

export default PassesTable;
