import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import {
  Badge,
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
import type { Locale } from '@rbx/intl';
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
import { formatDate } from '@modules/miscellaneous/utils/dateUtils';
import {
  TableSelectionProvider,
  useTableSelectionContext,
  useTableSelectionStoreInstance,
} from '@modules/monetization-shared/table-selection/context';
import {
  useSelectionActions,
  useSelectionStore,
} from '@modules/monetization-shared/table-selection/hooks';
import {
  hasTicketCategoryTranslationKey,
  TICKET_CATEGORY_TRANSLATION_KEY,
} from '../constants/ticketLabels';
import useBulkManageTicketsMutation from '../hooks/useBulkManageTicketsMutation';
import PlayerSupportBulkReplyDialog from './PlayerSupportBulkReplyDialog';
import {
  PlayerSupportTableHeaderCheckbox,
  PlayerSupportTableRowCheckbox,
} from './PlayerSupportTableCheckbox';
import TicketActionsMenu from './TicketActionsMenu';

interface PlayerSupportTableProps {
  tickets: CreatorTicketSummary[];
  universeId: number;
  locale: Locale;
  selectedStatus: TicketStatus;
  isMobile: boolean;
  isBulkManagementEnabled: boolean;
  onTicketClick: (ticketId: string, category?: string) => void;
  onSelectionChange: (hasSelection: boolean) => void;
}

const getTicketId = (ticket: CreatorTicketSummary): string => ticket.creatorTicketId ?? '';
const isTicketSelectable = (ticket: CreatorTicketSummary): boolean =>
  Boolean(ticket.creatorTicketId);

interface TicketRowProps {
  ticket: CreatorTicketSummary;
  universeId: number;
  locale: Locale;
  isBulkManagementEnabled: boolean;
  isSelectionDisabled: boolean;
  onClick: (ticketId: string, category?: string) => void;
}

const TicketRow = ({
  ticket,
  universeId,
  locale,
  isBulkManagementEnabled,
  isSelectionDisabled,
  onClick,
}: TicketRowProps) => {
  const { translate } = useTranslation();
  const categoryKey =
    ticket.category && hasTicketCategoryTranslationKey(ticket.category)
      ? TICKET_CATEGORY_TRANSLATION_KEY[ticket.category]
      : undefined;
  const categoryLabel = categoryKey ? translate(categoryKey) : (ticket.category ?? '');
  const isReportedToRoblox = ticket.reportedToRoblox === true;
  const displayTitle = isReportedToRoblox
    ? translate('Label.PlayerSupport.ContentHidden')
    : (ticket.title ?? '');

  const handleClick = () => {
    if (ticket.creatorTicketId) {
      onClick(ticket.creatorTicketId, ticket.category);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTableRowElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <tr
      className='group cursor-pointer height-1500 [border-bottom:var(--stroke-thin)_solid_var(--color-stroke-default)] last:[border-bottom:none] hover:bg-[var(--color-state-hover)]'
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={displayTitle}
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- a `<tr>` cannot be replaced with `<a>`; the row is intentionally clickable.
      role='link'
      tabIndex={0}>
      {/* oxlint-disable-next-line jsx-a11y/control-has-associated-label -- the row is labeled via aria-label above; the visible title text is nested in an inner flex div, deeper than the rule's lookup depth. */}
      <td className='content-default text-body-medium max-width-0 padding-x-medium'>
        <div className='items-center min-width-0 gap-small flex'>
          <span className='items-center justify-center size-200 shrink-0 flex'>
            {!ticket.viewedByCreator && ticket.status !== TicketStatus.Archived && (
              <span className='bg-action-emphasis size-200 radius-circle' />
            )}
          </span>
          {isBulkManagementEnabled && (
            <PlayerSupportTableRowCheckbox
              ticket={ticket}
              ariaLabel={displayTitle}
              isDisabled={isSelectionDisabled}
            />
          )}
          <div className='items-center min-width-0 gap-medium flex'>
            {isReportedToRoblox && (
              <Badge
                label={translate('Label.PlayerSupport.ReportedByYou')}
                variant='Alert'
                icon='icon-filled-flag'
              />
            )}
            <span className='text-no-wrap text-truncate-end min-width-0'>{displayTitle}</span>
          </div>
        </div>
      </td>
      <td className='text-no-wrap padding-x-medium'>
        <Badge label={categoryLabel} variant='Neutral' className='height-600' />
      </td>
      <td className='content-muted text-body-medium text-no-wrap padding-x-medium'>
        {ticket.createTime ? formatDate(ticket.createTime, locale) : ''}
      </td>
      <td className='width-[1%] padding-x-medium'>
        {ticket.creatorTicketId && ticket.status !== TicketStatus.Archived && (
          <TicketActionsMenu
            universeId={universeId}
            ticketId={ticket.creatorTicketId}
            surface='list'
          />
        )}
      </td>
    </tr>
  );
};

interface MobileTicketCardProps {
  ticket: CreatorTicketSummary;
  universeId: number;
  locale: Locale;
  isSelectionMode: boolean;
  isSelectionDisabled: boolean;
  onClick: (ticketId: string, category?: string) => void;
}

const MobileTicketCard = ({
  ticket,
  universeId,
  locale,
  isSelectionMode,
  isSelectionDisabled,
  onClick,
}: MobileTicketCardProps) => {
  const { translate } = useTranslation();
  const categoryKey =
    ticket.category && hasTicketCategoryTranslationKey(ticket.category)
      ? TICKET_CATEGORY_TRANSLATION_KEY[ticket.category]
      : undefined;
  const categoryLabel = categoryKey ? translate(categoryKey) : (ticket.category ?? '');
  const isReportedToRoblox = ticket.reportedToRoblox === true;
  const displayTitle = isReportedToRoblox
    ? translate('Label.PlayerSupport.ContentHidden')
    : (ticket.title ?? '');

  const handleClick = () => {
    if (!isSelectionMode && ticket.creatorTicketId) {
      onClick(ticket.creatorTicketId, ticket.category);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isSelectionMode && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- this element is interactive only in normal card mode; selection mode intentionally removes link behavior.
    <div
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- this card is intentionally a clickable row, not an `<a>`.
      role={isSelectionMode ? 'group' : 'link'}
      aria-label={displayTitle}
      tabIndex={isSelectionMode ? undefined : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`${isSelectionMode ? '' : 'cursor-pointer'} gap-medium flex flex-col`}>
      <div
        className={`padding-x-large padding-y-small radius-medium ${
          isSelectionMode ? 'bg-surface-100' : 'bg-shift-300'
        }`}>
        <div className='items-center justify-between gap-small flex'>
          <div className='items-center min-width-0 gap-large flex'>
            <span className='items-center justify-center size-200 shrink-0 flex'>
              {!ticket.viewedByCreator && ticket.status !== TicketStatus.Archived && (
                <span className='bg-action-emphasis size-200 radius-circle' />
              )}
            </span>
            {isSelectionMode && (
              <PlayerSupportTableRowCheckbox
                ticket={ticket}
                ariaLabel={displayTitle}
                isDisabled={isSelectionDisabled}
              />
            )}
            <div className='items-start min-width-0 gap-xsmall flex flex-col'>
              {isReportedToRoblox && (
                /* TODO: update this to 20% opacity when Foundation Web is updated. */
                <Badge
                  label={translate('Label.PlayerSupport.ReportedByYou')}
                  variant='Alert'
                  icon='icon-filled-flag'
                />
              )}
              <span className='content-emphasis text-body-medium min-width-0 clip [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]'>
                {displayTitle}
              </span>
            </div>
          </div>
          {!isSelectionMode &&
            (ticket.creatorTicketId && ticket.status !== TicketStatus.Archived ? (
              <TicketActionsMenu
                universeId={universeId}
                ticketId={ticket.creatorTicketId}
                alwaysVisible
                surface='list'
              />
            ) : (
              // Reserve the kebab's 32px footprint so archived cards keep the same
              // spacing (and title wrap width) as support-request cards.
              <span className='size-800 shrink-0' aria-hidden />
            ))}
        </div>
      </div>
      <div className='padding-x-xxlarge gap-medium flex flex-col'>
        <div className='items-center justify-between flex'>
          <span className='content-emphasis text-body-medium'>{translate('Title.Table.Type')}</span>
          <Badge label={categoryLabel} variant='Neutral' />
        </div>
        <div className='items-center justify-between flex'>
          <span className='content-emphasis text-body-medium'>
            {translate('Title.Table.Created')}
          </span>
          <span className='content-default text-body-medium'>
            {ticket.createTime ? formatDate(ticket.createTime, locale) : ''}
          </span>
        </div>
      </div>
    </div>
  );
};

const PlayerSupportTableContent = ({
  tickets,
  universeId,
  locale,
  selectedStatus,
  isMobile,
  isBulkManagementEnabled,
  onTicketClick,
  onSelectionChange,
}: PlayerSupportTableProps) => {
  const { translate } = useTranslation();
  const showSnackbarMessage = useSnackbarAlert();
  const selectionStore = useTableSelectionContext<string, CreatorTicketSummary>();
  const selectionState = useSelectionStore<string, CreatorTicketSummary>();
  const { reset, toggleBulk, toggleItem } = useSelectionActions<string, CreatorTicketSummary>();
  const { mutateAsync: manageTickets, isPending } = useBulkManageTicketsMutation();
  const [isBulkReplyOpen, setIsBulkReplyOpen] = useState(false);
  const [isMobileSelectionMode, setIsMobileSelectionMode] = useState(false);

  const selectedTickets = useMemo(
    () =>
      selectionState.data.items.filter(
        (ticket) =>
          ticket.creatorTicketId && selectionState.selectedMap.has(ticket.creatorTicketId),
      ),
    [selectionState],
  );
  const selectedCount = selectedTickets.length;
  useEffect(() => {
    onSelectionChange(
      isBulkManagementEnabled && (isMobile ? isMobileSelectionMode : selectedCount > 0),
    );
  }, [isBulkManagementEnabled, isMobile, isMobileSelectionMode, onSelectionChange, selectedCount]);
  useEffect(
    () => () => {
      onSelectionChange(false);
    },
    [onSelectionChange],
  );
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
    (response: BulkManageCreatorTicketsResponse) => {
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
          { vertical: 'bottom', horizontal: 'center' },
        );
        return;
      }

      showSnackbarMessage(
        'error',
        translate('Message.PlayerSupport.BulkActionFailure'),
        'standard',
        { vertical: 'bottom', horizontal: 'center' },
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
        {
          vertical: 'bottom',
          horizontal: 'center',
        },
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
        reconcileSelection(result);

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

  const handleExitMobileSelection = useCallback(() => {
    reset();
    setIsMobileSelectionMode(false);
  }, [reset]);

  const selectedLabel = translate('Label.PlayerSupport.SelectedCount', {
    count: String(selectedCount),
  });
  const selectLabel = translate('Action.PlayerSupport.Select');
  const selectAllLabel = translate('Action.PlayerSupport.SelectAll');
  const deselectAllLabel = translate('Action.PlayerSupport.DeselectAll');
  const replyLabel = translate('Action.PlayerSupport.Reply');
  const bulkReplyButton = (
    <Button
      variant='Emphasis'
      size='Medium'
      isDisabled={!canBulkReply || isPending}
      onClick={() => setIsBulkReplyOpen(true)}>
      {translate('Action.PlayerSupport.BulkReply')}
    </Button>
  );
  const mobileReplyButton = (
    <Button
      variant='Emphasis'
      size='Small'
      isDisabled={!canBulkReply || isPending}
      onClick={() => setIsBulkReplyOpen(true)}>
      {replyLabel}
    </Button>
  );
  const markAsReadLabel = translate('Action.PlayerSupport.MarkAsRead');
  const markAsUnreadLabel = translate('Action.PlayerSupport.MarkAsUnread');
  const mobileSelectionToolbar =
    isBulkManagementEnabled && isMobile && isMobileSelectionMode ? (
      <div className='bg-surface-0 stroke-default stroke-thin padding-medium [position:fixed] [bottom:0] [left:0] [right:0] [z-index:1]'>
        <div className='items-center gap-small flex'>
          <IconButton
            icon='icon-regular-chevron-large-left'
            ariaLabel={translate('Action.BackToSupportRequests')}
            variant='Utility'
            size='Small'
            isDisabled={isPending}
            onClick={handleExitMobileSelection}
          />
          <Button
            variant='Link'
            size='Small'
            isDisabled={isPending}
            onClick={() => toggleBulk(selectedCount === 0)}>
            {selectedCount === 0 ? selectAllLabel : deselectAllLabel}
          </Button>
          <span className='content-emphasis text-label-medium grow-1'>{selectedLabel}</span>
          {selectedStatus !== TicketStatus.Archived && mobileReplyButton}
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
            <PopoverContent side='top' align='end' ariaLabel={translate('Action.More')}>
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
      </div>
    ) : null;

  return (
    <>
      {isMobile ? (
        <>
          {isBulkManagementEnabled && (
            <div className='items-start margin-top-medium flex flex-col'>
              <Button
                variant='SoftEmphasis'
                size='Small'
                isDisabled={isMobileSelectionMode || isPending}
                onClick={() => setIsMobileSelectionMode(true)}>
                {selectLabel}
              </Button>
            </div>
          )}
          <div
            className={`margin-top-medium gap-[var(--size-1000)] flex flex-col ${
              isBulkManagementEnabled && isMobileSelectionMode ? 'padding-bottom-[72px]' : ''
            }`}>
            {tickets.map((ticket, index) => (
              <MobileTicketCard
                key={ticket.creatorTicketId ?? `ticket-${index}`}
                ticket={ticket}
                universeId={universeId}
                locale={locale}
                isSelectionMode={isBulkManagementEnabled && isMobileSelectionMode}
                isSelectionDisabled={isPending}
                onClick={onTicketClick}
              />
            ))}
          </div>
          {mobileSelectionToolbar}
        </>
      ) : (
        <>
          {isBulkManagementEnabled && selectedCount > 0 && (
            <div className='items-center gap-medium margin-top-large flex'>
              <span className='content-default text-label-medium margin-right-small'>
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
            </div>
          )}
          <div className='stroke-default margin-top-medium stroke-thin radius-large clip'>
            <table className='width-full ![border-collapse:collapse]'>
              <thead>
                <tr className='height-1200 [border-bottom:var(--stroke-thin)_solid_var(--color-stroke-default)]'>
                  <th className='content-emphasis text-label-medium text-align-x-left width-[50%] padding-x-medium'>
                    <span className='items-center gap-small flex'>
                      <span className='size-200 shrink-0' aria-hidden />
                      {isBulkManagementEnabled && (
                        <PlayerSupportTableHeaderCheckbox
                          ariaLabel={translate('Title.Table.Details')}
                          isDisabled={isPending}
                        />
                      )}
                      {translate('Title.Table.Details')}
                    </span>
                  </th>
                  <th className='content-emphasis text-label-medium text-no-wrap text-align-x-left width-[176px] padding-x-medium'>
                    {translate('Title.Table.Type')}
                  </th>
                  <th className='content-emphasis text-label-medium text-no-wrap text-align-x-left width-[176px] padding-x-medium'>
                    {translate('Title.Table.Created')}
                  </th>
                  <th className='width-[1%] padding-x-medium' aria-hidden='true' />
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket, index) => (
                  <TicketRow
                    key={ticket.creatorTicketId ?? `ticket-${index}`}
                    ticket={ticket}
                    universeId={universeId}
                    locale={locale}
                    isBulkManagementEnabled={isBulkManagementEnabled}
                    isSelectionDisabled={isPending}
                    onClick={onTicketClick}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {isBulkManagementEnabled && canBulkReply && selectedCategory && (
        <PlayerSupportBulkReplyDialog
          open={isBulkReplyOpen}
          category={selectedCategory}
          categoryLabel={selectedCategoryLabel}
          selectedCount={selectedCount}
          isPending={isPending}
          universeId={universeId}
          onOpenChange={setIsBulkReplyOpen}
          onSend={(response) =>
            handleBulkAction(BulkManageCreatorTicketsAction.BulkReply, response)
          }
        />
      )}
    </>
  );
};

const PlayerSupportTable = (props: PlayerSupportTableProps) => {
  const selectionStore = useTableSelectionStoreInstance(
    {
      identifier: getTicketId,
      selectable: isTicketSelectable,
    },
    {
      currentPage: props.tickets,
      items: props.tickets,
      mode: 'page',
    },
  );

  return (
    <TableSelectionProvider store={selectionStore}>
      <PlayerSupportTableContent {...props} />
    </TableSelectionProvider>
  );
};

export default PlayerSupportTable;
