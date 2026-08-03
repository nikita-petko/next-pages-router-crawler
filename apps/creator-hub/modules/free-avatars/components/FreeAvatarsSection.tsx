import { useCallback, useMemo, useState } from 'react';
import { Button } from '@rbx/foundation-ui';
import { withTranslation, useTranslation } from '@rbx/intl';
import { useSnackbar } from '@rbx/ui';
import GenericTablePagination from '@modules/charts-generic/tables/GenericTablePagination';
import GenericTableV2 from '@modules/charts-generic/tables/GenericTableV2';
import {
  useLinkedAvatarIdsQuery,
  useLinkedAvatarDetails,
  useUnlinkAvatarMutation,
} from '@modules/clients/lookQueries';
import { toastDurationTime } from '@modules/miscellaneous/common';
import { EStudioTaskType, useStudio } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../constants';
import {
  buildLinkedAvatarsRowData,
  LINKED_AVATARS_COLUMN_CONFIGS,
} from '../linkedAvatarsColumnConfigs';
import AddAvatarsModal from './AddAvatarsModal';
import FreeAvatarsEmptyState from './FreeAvatarsEmptyState';
import FreeAvatarsTestModuleSection from './FreeAvatarsTestModuleSection';

function FreeAvatarsSection({ universeId }: { universeId: number }) {
  const { translate } = useTranslation();

  const [isAddAvatarsModalOpen, setIsAddAvatarsModalOpen] = useState(false);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [page, setPage] = useState(0);

  const {
    data: allLookIds,
    isPending,
    isError,
  } = useLinkedAvatarIdsQuery({ universeId, enabled: true });

  const lookIds = useMemo(() => allLookIds ?? [], [allLookIds]);
  const totalCount = lookIds.length;
  const lastPage = totalCount > 0 ? Math.ceil(totalCount / pageSize) - 1 : 0;
  const pageIndex = Math.min(page, lastPage);
  const pageIds = useMemo(
    () => lookIds.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
    [lookIds, pageIndex, pageSize],
  );

  const detailResults = useLinkedAvatarDetails(pageIds);

  const showMarketingEmptyState = !isPending && !isError && totalCount === 0;
  const showErrorState = isError;
  const isLoading = isPending && allLookIds == null;

  const setPageSizeAndReset = useCallback((next: number) => {
    setPageSize(next);
    setPage(0);
  }, []);

  const hasNext = pageIndex * pageSize + pageSize < totalCount;
  const hasPrevious = pageIndex > 0;

  const onNextPage = useCallback(() => {
    setPage((p) => p + 1);
  }, []);

  const onPreviousPage = useCallback(() => {
    setPage((p) => Math.max(0, p - 1));
  }, []);

  const paginationSpec = useMemo(
    () => ({
      page: pageIndex,
      total: totalCount,
      pageSize,
      pageSizeOptions: PAGE_SIZE_OPTIONS,
      setPageSize: setPageSizeAndReset,
      onNextPage,
      onPreviousPage,
      hasNext,
      hasPrevious,
    }),
    [
      pageIndex,
      totalCount,
      pageSize,
      setPageSizeAndReset,
      onNextPage,
      onPreviousPage,
      hasNext,
      hasPrevious,
    ],
  );

  const openAddAvatarsModal = useCallback(() => {
    setIsAddAvatarsModalOpen(true);
  }, []);

  const closeAddAvatarsModal = useCallback(() => {
    setIsAddAvatarsModalOpen(false);
  }, []);

  const { isCompatible, open: openStudio, dialog: studioDialog } = useStudio();

  const handleOpenStudioFromAddAvatars = useCallback(() => {
    closeAddAvatarsModal();
    window.setTimeout(() => {
      if (isCompatible) {
        openStudio({ task: EStudioTaskType.Default });
        return;
      }
      window.open(creatorHub.docs.getSettingUpStudioUrl(), '_self');
    }, 0);
  }, [closeAddAvatarsModal, isCompatible, openStudio]);

  const { enqueue, close: closeSnackbar } = useSnackbar();
  const { mutate: unlinkAvatar } = useUnlinkAvatarMutation();

  const onRemoveLook = useCallback(
    (lookId: string) => {
      unlinkAvatar(
        { universeId: String(universeId), lookId },
        {
          onError: () => {
            enqueue({
              message: <span>{translate('Error.LookUnlinkFailure')}</span>,
              anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
              autoHideDuration: toastDurationTime,
              autoHide: true,
              onClose: closeSnackbar,
            });
          },
        },
      );
    },
    [unlinkAvatar, universeId, enqueue, translate, closeSnackbar],
  );

  const onCopyLookIdSuccess = useCallback(() => {
    enqueue({
      message: (
        <span data-testid='success-message'>
          {translate('Message.CopySuccess', { item: translate('Label.LookID') })}
        </span>
      ),
      anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
      autoHideDuration: toastDurationTime,
      autoHide: true,
      onClose: closeSnackbar,
    });
  }, [enqueue, closeSnackbar, translate]);

  const statusLabels = useMemo(
    () => ({
      enabled: translate('Label.ActiveStatus'),
      moderated: translate('Label.Moderated'),
      disabled: translate('Label.InactiveStatus'),
    }),
    [translate],
  );

  const rowActionsLabels = useMemo(
    () => ({
      openInNewTab: translate('Action.OpenInNewTab'),
      copyLookId: translate('Action.CopyLookID'),
      remove: translate('Action.Remove'),
      rowActionsAriaLabel: translate('Action.MoreOptions'),
    }),
    [translate],
  );

  const freeAvatarLabel = translate('Label.FreeAvatarToggle');

  const rowData = useMemo(
    () =>
      pageIds.map((lookId, i) =>
        buildLinkedAvatarsRowData(lookId, detailResults[i]?.data, {
          onRemoveLook,
          onCopyLookIdSuccess,
          statusLabels,
          rowActionsLabels,
          freeAvatarLabel,
        }),
      ),
    [
      pageIds,
      detailResults,
      onRemoveLook,
      onCopyLookIdSuccess,
      statusLabels,
      rowActionsLabels,
      freeAvatarLabel,
    ],
  );

  const getRowKey = useCallback((_: unknown, index: number) => String(index), []);

  return (
    <>
      <div className='flex flex-col gap-large padding-top-large width-full'>
        {showMarketingEmptyState ? (
          <FreeAvatarsEmptyState onAddAvatars={openAddAvatarsModal} />
        ) : (
          <>
            <div className='flex justify-start'>
              <Button
                variant='Emphasis'
                size='Medium'
                type='button'
                data-testid='freeAvatarsAddAvatarsButton'
                onClick={openAddAvatarsModal}>
                {translate('Action.AddAvatars')}
              </Button>
            </div>
            <div className='flex flex-col width-full'>
              <div className='radius-medium stroke-standard stroke-default width-full clip'>
                <GenericTableV2
                  columnConfigs={LINKED_AVATARS_COLUMN_CONFIGS}
                  rowData={rowData}
                  getRowKey={getRowKey}
                  isDataLoading={isLoading}
                  isResponseFailed={showErrorState}
                  isUserForbidden={false}
                  pagination={null}
                  tableConfig={{ tableBorder: false }}
                />
              </div>
              <div className='padding-y-small width-full flex justify-end'>
                <div className='width-max shrink-0'>
                  <GenericTablePagination {...paginationSpec} />
                </div>
              </div>
            </div>
          </>
        )}

        <FreeAvatarsTestModuleSection />
      </div>

      <AddAvatarsModal
        open={isAddAvatarsModalOpen}
        onClose={closeAddAvatarsModal}
        onOpenStudio={handleOpenStudioFromAddAvatars}
        universeId={universeId}
      />
      {studioDialog}
    </>
  );
}

export default withTranslation(FreeAvatarsSection, [
  TranslationNamespace.Creations,
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.Error,
]);
