import { useCallback, useMemo, useState } from 'react';
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogTitle,
  FeedbackBanner,
  Link,
} from '@rbx/foundation-ui';
import { withTranslation, useTranslation } from '@rbx/intl';
import { useSnackbar } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import GenericTablePagination from '@modules/charts-generic/tables/GenericTablePagination';
import GenericTableV2 from '@modules/charts-generic/tables/GenericTableV2';
import { useLinkedAvatarIdsQuery, useLinkAvatarsMutation } from '@modules/clients/lookQueries';
import { toastDurationTime } from '@modules/miscellaneous/common';
import { EmptyStateIllustration } from '@modules/miscellaneous/components/EmptyState/EmptyState';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ADD_AVATARS_COLUMN_CONFIGS, buildAddAvatarsRowData } from '../addAvatarsColumnConfigs';
import { useAvatarLooksPagination } from '../hooks/useAvatarLooksPagination';

type AddAvatarsModalProps = {
  open: boolean;
  onClose: () => void;
  onOpenStudio: () => void;
  universeId: number;
};

function AddAvatarsModal({ open, onClose, onOpenStudio, universeId }: AddAvatarsModalProps) {
  const { translate, translateHTML } = useTranslation();
  const { user } = useAuthentication();
  const curatorIdString = user?.id != null ? String(user.id) : '';

  const closeLabel = translate('Action.Close');

  const [selectedLookIds, setSelectedLookIds] = useState<ReadonlySet<string>>(() => new Set());
  const [isRestrictionWarningVisible, setIsRestrictionWarningVisible] = useState(true);

  const {
    tableRows,
    paginationSpec,
    isLoading,
    isPending,
    isError,
    hasAnyLookInCache,
    totalLooksCount,
  } = useAvatarLooksPagination({
    curatorIdString,
    enabled: open && Boolean(curatorIdString),
  });

  const looksQueryEnabled = open && Boolean(curatorIdString);
  const showEmptyState =
    open && !isPending && !isError && (!looksQueryEnabled || !hasAnyLookInCache);
  const showErrorState = open && looksQueryEnabled && isError;

  const toggleLookSelected = useCallback((lookId: string) => {
    setSelectedLookIds((prev) => {
      const next = new Set(prev);
      if (next.has(lookId)) {
        next.delete(lookId);
      } else {
        next.add(lookId);
      }
      return next;
    });
  }, []);

  const selectedCount = selectedLookIds.size;

  const formatItemCount = useCallback(
    (itemCount: number) => translate('Message.ItemCount', { numItems: String(itemCount) }),
    [translate],
  );

  const { data: linkedLookIdsArray } = useLinkedAvatarIdsQuery({ universeId, enabled: open });
  const linkedLookIds = useMemo<ReadonlySet<string>>(
    () => new Set((linkedLookIdsArray ?? []).filter(Boolean)),
    [linkedLookIdsArray],
  );

  const rowData = useMemo(
    () =>
      tableRows.map((look) =>
        buildAddAvatarsRowData(look, {
          selectedLookIds,
          linkedLookIds,
          toggleLookSelected,
          formatItemCount,
        }),
      ),
    [tableRows, selectedLookIds, linkedLookIds, toggleLookSelected, formatItemCount],
  );

  const getRowKey = useCallback((_: unknown, index: number) => String(index), []);

  const handleDialogOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        onClose();
        setSelectedLookIds(new Set());
        setIsRestrictionWarningVisible(true);
      }
    },
    [onClose],
  );

  const { enqueue, close: closeSnackbar } = useSnackbar();
  const { mutate: linkAvatars, isPending: isLinking } = useLinkAvatarsMutation();

  const handleAdd = useCallback(() => {
    linkAvatars(
      { universeId: String(universeId), lookIds: Array.from(selectedLookIds) },
      {
        onSuccess: () => {
          onClose();
          setSelectedLookIds(new Set());
        },
        onError: () => {
          enqueue({
            message: <span>{translate('Error.LookLinkFailure')}</span>,
            anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
            autoHideDuration: toastDurationTime,
            autoHide: true,
            onClose: closeSnackbar,
          });
        },
      },
    );
  }, [linkAvatars, universeId, selectedLookIds, onClose, enqueue, translate, closeSnackbar]);

  return (
    <Dialog
      open={open}
      onOpenChange={handleDialogOpenChange}
      size='Large'
      isModal
      hasCloseAffordance
      closeLabel={closeLabel}>
      <DialogContent className='flex flex-col width-[70vw] !max-width-[95vw] max-height-[80vh]'>
        <DialogBody className='flex flex-col gap-none padding-none min-height-[0px] fill clip'>
          <div className='shrink-0 padding-x-large padding-top-large padding-bottom-medium'>
            <DialogTitle className='text-heading-medium margin-none padding-right-xxlarge'>
              {translate('Heading.AddFreeAvatars')}
            </DialogTitle>
          </div>

          {isRestrictionWarningVisible ? (
            <div className='shrink-0 padding-x-large padding-bottom-medium'>
              <FeedbackBanner
                className='width-full'
                title=''
                description={translate('Message.FreeAvatarRestrictionWarning')}
                linkLabel={translate('Action.ViewDetails')}
                linkHref='#'
                severity='Warning'
                variant='Emphasis'
                layout='Inline'
                onDismiss={() => {
                  setIsRestrictionWarningVisible(false);
                }}
                dismissIconAriaLabel={closeLabel}
              />
            </div>
          ) : null}

          <div className='flex fill flex-col min-height-[0px] min-width-0 padding-x-large'>
            <div className='flex fill flex-col min-height-[0px] radius-medium stroke-standard stroke-default width-full clip'>
              <div className='fill min-height-[0px] scroll-y scroll-x width-full'>
                {showEmptyState ? (
                  <div className='flex min-height-[360px] width-full flex-col items-center justify-center padding-y-[40px] padding-x-xlarge'>
                    <div className='flex flex-col items-center gap-medium width-full max-width-[480px]'>
                      <EmptyStateIllustration illustration='avatarItem' />
                      <div className='flex flex-col items-center gap-small width-full max-width-[420px]'>
                        <h2 className='text-heading-medium content-emphasis margin-none'>
                          {translate('Label.EmptyStateAddFreeAvatar')}
                        </h2>
                        <div className='text-body-large content-muted'>
                          {translateHTML('Description.EmptyStateAddFreeAvatar', [
                            {
                              opening: 'linkStart',
                              closing: 'linkEnd',
                              content: (chunks: React.ReactNode) => (
                                <Link href='#' color='Standard' className='text-body-large'>
                                  {chunks}
                                </Link>
                              ),
                            },
                          ])}
                        </div>
                      </div>
                      <Button variant='Emphasis' size='Medium' type='button' onClick={onOpenStudio}>
                        {translate('Action.OpenStudio')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <GenericTableV2
                    columnConfigs={ADD_AVATARS_COLUMN_CONFIGS}
                    rowData={rowData}
                    getRowKey={getRowKey}
                    isDataLoading={open && isLoading}
                    isResponseFailed={showErrorState}
                    isUserForbidden={false}
                    pagination={null}
                    tableConfig={{ tableBorder: false }}
                  />
                )}
              </div>
              {!showEmptyState ? (
                <div className='shrink-0 padding-x-large padding-y-medium flex items-center justify-between gap-medium wrap'>
                  <span className='text-body-medium content-emphasis margin-none shrink-0'>
                    {translate('Message.SelectedCount', {
                      numSelected: String(selectedCount),
                      numTotal: String(totalLooksCount),
                    })}
                  </span>
                  <div className='width-max shrink-0'>
                    <GenericTablePagination {...paginationSpec} />
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className='shrink-0 padding-x-large padding-y-xlarge'>
            <div className='flex gap-small width-full'>
              <Button
                variant='Emphasis'
                size='Medium'
                type='button'
                className='fill basis-0'
                isDisabled={showEmptyState || selectedCount === 0 || isLinking}
                onClick={handleAdd}>
                {translate('Action.Add')}
              </Button>
              <Button
                variant='Standard'
                size='Medium'
                type='button'
                className='fill basis-0'
                isDisabled={showEmptyState}>
                {translate('Action.AddByOutfitId')}
              </Button>
            </div>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

export default withTranslation(AddAvatarsModal, [
  TranslationNamespace.Creations,
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.Error,
]);
