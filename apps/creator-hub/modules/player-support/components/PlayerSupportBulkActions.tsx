import { useCallback, useMemo, useState, type FunctionComponent } from 'react';
import {
  Button,
  IconButton,
  Menu,
  MenuItem,
  MenuSection,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipTrigger,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import {
  BulkManageCreatorTicketResultStatus,
  BulkManageCreatorTicketsAction,
  TicketCategory,
  TicketStatus,
  type BulkManageCreatorTicketsResponse,
  type CreatorTicketSummary,
  type TicketResponse,
} from '@modules/clients/creatorCommunication';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import useSnackbarAlert from '@modules/miscellaneous/hooks/useSnackbarAlert';
import { useTableSelectionContext } from '@modules/monetization-shared/table-selection/context';
import {
  useSelectionActions,
  useSelectionStore,
} from '@modules/monetization-shared/table-selection/hooks';
import {
  hasTicketCategoryTranslationKey,
  TICKET_CATEGORY_TRANSLATION_KEY,
} from '../constants/ticketLabels';
import useBulkManageTicketsMutation from '../hooks/useBulkManageTicketsMutation';
import { getTicketId } from '../utils/ticketSelection';
import PlayerSupportBulkReplyDialog from './PlayerSupportBulkReplyDialog';
import { PlayerSupportTableHeaderCheckbox } from './PlayerSupportTableCheckbox';

interface PlayerSupportBulkActionsProps {
  universeId: number;
  selectedStatus: TicketStatus;
  isMobile: boolean;
  /** Exits the card layout's selection mode, which the caller owns. */
  onExitSelectionMode: () => void;
}

const SNACKBAR_ANCHOR = { vertical: 'bottom', horizontal: 'center' } as const;

const PlayerSupportBulkActions: FunctionComponent<PlayerSupportBulkActionsProps> = ({
  universeId,
  selectedStatus,
  isMobile,
  onExitSelectionMode,
}) => {
  const { translate } = useTranslation();
  const showSnackbarMessage = useSnackbarAlert();
  const selectionStore = useTableSelectionContext<string, CreatorTicketSummary>();
  const selectionState = useSelectionStore<string, CreatorTicketSummary>();
  const { reset, toggleItem } = useSelectionActions<string, CreatorTicketSummary>();
  const { mutateAsync: manageTickets, isPending } = useBulkManageTicketsMutation();
  const [isBulkReplyOpen, setIsBulkReplyOpen] = useState(false);

  const selectedTickets = useMemo(
    () =>
      selectionState.data.items.filter(
        (ticket) =>
          ticket.creatorTicketId && selectionState.selectedMap.has(ticket.creatorTicketId),
      ),
    [selectionState],
  );
  const selectedCount = selectedTickets.length;
  const allSelectedRead =
    selectedCount > 0 && selectedTickets.every((ticket) => ticket.viewedByCreator === true);
  const allSelectedUnread =
    selectedCount > 0 && selectedTickets.every((ticket) => ticket.viewedByCreator !== true);
  const selectedCategories = new Set(selectedTickets.map((ticket) => ticket.category));
  const selectedCategory = selectedCategories.size === 1 ? selectedTickets[0]?.category : undefined;
  const canBulkReply =
    selectedCategory !== undefined &&
    selectedCategory !== TicketCategory.Invalid &&
    selectedStatus !== TicketStatus.Archived;
  const categoryKey =
    selectedCategory && hasTicketCategoryTranslationKey(selectedCategory)
      ? TICKET_CATEGORY_TRANSLATION_KEY[selectedCategory]
      : undefined;
  const selectedCategoryLabel = categoryKey ? translate(categoryKey) : '';

  const reconcileSelection = useCallback(
    (response: BulkManageCreatorTicketsResponse, action: BulkManageCreatorTicketsAction) => {
      if (action !== BulkManageCreatorTicketsAction.BulkReply) {
        return;
      }

      const failedIds = new Set(
        (response.results ?? []).flatMap((result) =>
          result.resultStatus === BulkManageCreatorTicketResultStatus.Failed &&
          result.creatorTicketId
            ? [result.creatorTicketId]
            : [],
        ),
      );
      const failedCount = response.failedCount ?? failedIds.size;

      if (failedCount === 0) {
        reset();
        return;
      }

      if (failedIds.size > 0) {
        selectionStore.getSelectedViewableItems().forEach((ticket) => {
          if (!failedIds.has(getTicketId(ticket))) {
            toggleItem(ticket, false);
          }
        });
      }
    },
    [reset, selectionStore, toggleItem],
  );

  const showFailureMessage = useCallback(
    (succeededCount?: number, failedCount?: number) => {
      if ((succeededCount ?? 0) > 0 && (failedCount ?? 0) > 0) {
        showSnackbarMessage(
          'error',
          translate('Message.PlayerSupport.BulkActionPartialFailure', {
            succeeded: String(succeededCount),
            failed: String(failedCount),
          }),
          'standard',
          SNACKBAR_ANCHOR,
        );
        return;
      }

      showSnackbarMessage(
        'error',
        translate('Message.PlayerSupport.BulkActionFailure'),
        'standard',
        SNACKBAR_ANCHOR,
      );
    },
    [showSnackbarMessage, translate],
  );

  const showBulkReplySuccessMessage = useCallback(
    (count: number) => {
      showSnackbarMessage(
        'success',
        translate('Message.PlayerSupport.BulkRepliesSent', { count: String(count) }),
        'standard',
        SNACKBAR_ANCHOR,
      );
    },
    [showSnackbarMessage, translate],
  );

  const handleBulkAction = useCallback(
    async (action: BulkManageCreatorTicketsAction, response?: TicketResponse): Promise<boolean> => {
      const currentSelection = selectionStore.getSelectedViewableItems();
      const creatorTicketIds = currentSelection.flatMap((ticket) =>
        ticket.creatorTicketId ? [ticket.creatorTicketId] : [],
      );
      if (creatorTicketIds.length === 0) {
        return false;
      }

      unifiedLoggerClient.logClickEvent({
        eventName: 'playerSupport.bulkManage',
        parameters: {
          universeId: String(universeId),
          action,
          selectedCount: String(creatorTicketIds.length),
          ticketCategory: selectedCategory ?? '',
          replyType: response ?? '',
        },
      });

      try {
        const result = await manageTickets({
          universeId,
          creatorTicketIds,
          action,
          response,
        });
        reconcileSelection(result, action);

        const succeededCount =
          result.succeededCount ??
          (result.results ?? []).filter(
            (ticketResult) =>
              ticketResult.resultStatus === BulkManageCreatorTicketResultStatus.Succeeded,
          ).length;
        const failedCount =
          result.failedCount ??
          (result.results ?? []).filter(
            (ticketResult) =>
              ticketResult.resultStatus === BulkManageCreatorTicketResultStatus.Failed,
          ).length;
        if (failedCount > 0) {
          showFailureMessage(succeededCount, failedCount);
          return false;
        }

        if (action === BulkManageCreatorTicketsAction.BulkReply) {
          showBulkReplySuccessMessage(succeededCount || creatorTicketIds.length);
        }
        return true;
      } catch {
        showFailureMessage();
        return false;
      }
    },
    [
      manageTickets,
      reconcileSelection,
      selectedCategory,
      selectionStore,
      showBulkReplySuccessMessage,
      showFailureMessage,
      universeId,
    ],
  );

  const handleExitSelectionMode = useCallback(() => {
    reset();
    onExitSelectionMode();
  }, [onExitSelectionMode, reset]);

  const selectedLabel = translate('Label.PlayerSupport.SelectedCount', {
    count: String(selectedCount),
  });
  const selectAllLabel = translate('Action.PlayerSupport.SelectAll');
  const deselectAllLabel = translate('Action.PlayerSupport.DeselectAll');
  const markAsReadLabel = translate('Action.PlayerSupport.MarkAsRead');
  const markAsUnreadLabel = translate('Action.PlayerSupport.MarkAsUnread');
  const replyLabel = translate('Action.PlayerSupport.Reply');
  const bulkReplyButton = (
    <Button
      variant='Emphasis'
      size='Medium'
      className='min-width-[120px]'
      isDisabled={!canBulkReply || isPending}
      onClick={() => setIsBulkReplyOpen(true)}>
      {selectedCount === 1 ? replyLabel : translate('Action.PlayerSupport.BulkReply')}
    </Button>
  );

  const bulkReplyDialog =
    canBulkReply && selectedCategory ? (
      <PlayerSupportBulkReplyDialog
        open={isBulkReplyOpen}
        category={selectedCategory}
        categoryLabel={selectedCategoryLabel}
        selectedCount={selectedCount}
        isPending={isPending}
        universeId={universeId}
        onOpenChange={setIsBulkReplyOpen}
        onSend={(response) => handleBulkAction(BulkManageCreatorTicketsAction.BulkReply, response)}
      />
    ) : null;

  // The card layout pins its actions to the bottom of the viewport.
  if (isMobile) {
    const bulkSelectionLabel = selectedCount === 0 ? selectAllLabel : deselectAllLabel;

    return (
      <div className='bg-surface-100 padding-x-large padding-y-small [position:fixed] [bottom:0] [left:0] [right:0] [z-index:1]'>
        <div className='items-center gap-small flex'>
          <div className='items-center gap-medium shrink-0 flex'>
            <IconButton
              icon='icon-regular-chevron-large-left'
              ariaLabel={translate('Action.BackToSupportRequests')}
              variant='Utility'
              size='Small'
              isDisabled={isPending}
              onClick={handleExitSelectionMode}
            />
            <PlayerSupportTableHeaderCheckbox
              ariaLabel={bulkSelectionLabel}
              label={bulkSelectionLabel}
              isDisabled={isPending}
            />
          </div>
          <span
            className='content-emphasis text-label-medium text-align-x-right grow-1'
            aria-label={selectedCount > 0 ? selectedLabel : undefined}>
            {selectedCount > 0 ? selectedCount : null}
          </span>
          {selectedStatus !== TicketStatus.Archived && (
            <Button
              variant='Emphasis'
              size='Small'
              isDisabled={!canBulkReply || isPending}
              onClick={() => setIsBulkReplyOpen(true)}>
              {replyLabel}
            </Button>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <IconButton
                icon='icon-filled-three-dots-vertical'
                ariaLabel={translate('Action.More')}
                variant='Utility'
                size='Small'
                isDisabled={selectedCount === 0 || isPending}
              />
            </PopoverTrigger>
            <PopoverContent
              side='top'
              align='end'
              className='width-[232px]'
              ariaLabel={translate('Action.More')}>
              <Menu size='Medium'>
                <MenuSection>
                  <MenuItem
                    value='mark-as-read'
                    title={markAsReadLabel}
                    disabled={selectedCount === 0 || allSelectedRead || isPending}
                    onSelect={() => {
                      void handleBulkAction(BulkManageCreatorTicketsAction.MarkAsRead);
                    }}
                  />
                  <MenuItem
                    value='mark-as-unread'
                    title={markAsUnreadLabel}
                    disabled={selectedCount === 0 || allSelectedUnread || isPending}
                    onSelect={() => {
                      void handleBulkAction(BulkManageCreatorTicketsAction.MarkAsUnread);
                    }}
                  />
                </MenuSection>
              </Menu>
            </PopoverContent>
          </Popover>
        </div>
        {bulkReplyDialog}
      </div>
    );
  }

  return (
    <div className='items-center gap-medium flex'>
      <span className='content-default text-label-medium min-width-[120px] margin-right-small'>
        {selectedLabel}
      </span>
      {selectedStatus !== TicketStatus.Archived &&
        (canBulkReply ? (
          bulkReplyButton
        ) : (
          <Tooltip
            position='top-center'
            delayDurationMs={0}
            title={translate('Description.PlayerSupport.BulkReplySameCategory')}>
            <TooltipTrigger asChild>
              <span>{bulkReplyButton}</span>
            </TooltipTrigger>
          </Tooltip>
        ))}
      <Button
        variant='Standard'
        size='Medium'
        isDisabled={allSelectedRead || isPending}
        onClick={() => {
          void handleBulkAction(BulkManageCreatorTicketsAction.MarkAsRead);
        }}>
        {markAsReadLabel}
      </Button>
      <Button
        variant='Standard'
        size='Medium'
        isDisabled={allSelectedUnread || isPending}
        onClick={() => {
          void handleBulkAction(BulkManageCreatorTicketsAction.MarkAsUnread);
        }}>
        {markAsUnreadLabel}
      </Button>
      {bulkReplyDialog}
    </div>
  );
};

export default PlayerSupportBulkActions;
