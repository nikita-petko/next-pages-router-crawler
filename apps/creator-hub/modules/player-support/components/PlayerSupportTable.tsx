import type { KeyboardEvent, ReactNode } from 'react';
import { useIsMutating } from '@tanstack/react-query';
import { Badge, Button, clsx } from '@rbx/foundation-ui';
import type { Locale } from '@rbx/intl';
import { useTranslation } from '@rbx/intl';
import { ArrowDownwardIcon, ArrowUpwardIcon } from '@rbx/ui';
import {
  CreatorTicketUpdateTimeSortOrder,
  TicketStatus,
  type CreatorTicketSummary,
} from '@modules/clients/creatorCommunication';
import { formatDate } from '@modules/miscellaneous/utils/dateUtils';
import {
  hasTicketCategoryTranslationKey,
  TICKET_CATEGORY_TRANSLATION_KEY,
} from '../constants/ticketLabels';
import { BULK_MANAGE_TICKETS_MUTATION_KEY } from '../hooks/useBulkManageTicketsMutation';
import {
  PlayerSupportTableHeaderCheckbox,
  PlayerSupportTableRowCheckbox,
} from './PlayerSupportTableCheckbox';
import TicketActionsMenu from './TicketActionsMenu';

interface PlayerSupportTableProps {
  tickets: CreatorTicketSummary[];
  universeId: number;
  locale: Locale;
  isMobile: boolean;
  isBulkManagementEnabled: boolean;
  /** Whether the card layout is in selection mode; only the card layout reads it. */
  isSelectionMode: boolean;
  onTicketClick: (ticketId: string, category?: string) => void;
  onEnterSelectionMode: () => void;
  /** The card layout's bulk actions, which pin themselves to the bottom of the viewport. */
  bulkActions?: ReactNode;
  /** Rendered trailing the `Select` button on the card layout. */
  trailingActions?: ReactNode;
  updateTimeSortOrder: CreatorTicketUpdateTimeSortOrder;
  onSortOrderChange: () => void;
}

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
  const isForwardedToRoblox = ticket.forwardedToRoblox === true;
  const isContentHidden = isReportedToRoblox || isForwardedToRoblox;
  const displayTitle = isContentHidden
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
            <span className='margin-right-small shrink-0'>
              <PlayerSupportTableRowCheckbox
                ticket={ticket}
                ariaLabel={displayTitle}
                isDisabled={isSelectionDisabled}
              />
            </span>
          )}
          <div className='items-center min-width-0 gap-medium flex'>
            {isReportedToRoblox && (
              <Badge
                label={translate('Label.PlayerSupport.ReportedByYou')}
                variant='Alert'
                icon='icon-filled-flag'
              />
            )}
            {isForwardedToRoblox && !isReportedToRoblox && (
              <Badge
                label={translate('Label.PlayerSupport.ForwardedToRoblox')}
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
        {ticket.updateTime ? formatDate(ticket.updateTime, locale) : ''}
      </td>
      <td className='width-[1%] padding-x-medium'>
        {ticket.creatorTicketId &&
          ticket.status !== TicketStatus.Archived &&
          !isForwardedToRoblox && (
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
  const isForwardedToRoblox = ticket.forwardedToRoblox === true;
  const isContentHidden = isReportedToRoblox || isForwardedToRoblox;
  const displayTitle = isContentHidden
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
          <div
            className={clsx(
              'items-center min-width-0 flex [transition:gap_300ms_ease] motion-reduce:[transition:none]',
              isSelectionMode ? 'gap-large' : 'gap-[0px]',
            )}>
            <span
              className={clsx(
                'clip shrink-0 motion-reduce:[transition:none]',
                isSelectionMode
                  ? 'visible max-width-800 opacity-[1] [transition:max-width_300ms_ease,opacity_300ms_ease,visibility_0s_linear_0s]'
                  : 'invisible max-width-0 opacity-[0] [transition:max-width_300ms_ease,opacity_300ms_ease,visibility_0s_linear_300ms]',
              )}
              aria-hidden={!isSelectionMode}>
              <PlayerSupportTableRowCheckbox
                ticket={ticket}
                ariaLabel={displayTitle}
                isDisabled={isSelectionDisabled || !isSelectionMode}
              />
            </span>
            <div className='items-start min-width-0 gap-xsmall flex flex-col'>
              {isReportedToRoblox && (
                /* TODO: update this to 20% opacity when Foundation Web is updated. */
                <Badge
                  label={translate('Label.PlayerSupport.ReportedByYou')}
                  variant='Alert'
                  icon='icon-filled-flag'
                />
              )}
              {isForwardedToRoblox && !isReportedToRoblox && (
                <Badge
                  label={translate('Label.PlayerSupport.ForwardedToRoblox')}
                  variant='Alert'
                  icon='icon-filled-flag'
                />
              )}
              <span className='items-center min-width-0 max-width-full gap-xsmall flex'>
                <span className='content-emphasis text-body-medium min-width-0 clip [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]'>
                  {displayTitle}
                </span>
                {!ticket.viewedByCreator && ticket.status !== TicketStatus.Archived && (
                  <span
                    className='bg-action-emphasis size-200 radius-circle shrink-0'
                    aria-hidden='true'
                  />
                )}
              </span>
            </div>
          </div>
          {ticket.creatorTicketId &&
          ticket.status !== TicketStatus.Archived &&
          !isForwardedToRoblox ? (
            <TicketActionsMenu
              universeId={universeId}
              ticketId={ticket.creatorTicketId}
              alwaysVisible
              surface='list'
            />
          ) : (
            <span className='size-800 shrink-0' aria-hidden />
          )}
        </div>
      </div>
      <div className='padding-x-xxlarge gap-medium flex flex-col'>
        <div className='items-center justify-between flex'>
          <span className='content-emphasis text-body-medium'>{translate('Title.Table.Type')}</span>
          <Badge label={categoryLabel} variant='Neutral' />
        </div>
        <div className='items-center justify-between flex'>
          <span className='content-emphasis text-body-medium'>
            {translate('Label.DetailsSidebar.LastUpdated')}
          </span>
          <span className='content-default text-body-medium'>
            {ticket.updateTime ? formatDate(ticket.updateTime, locale) : ''}
          </span>
        </div>
      </div>
    </div>
  );
};

const PlayerSupportTable = ({
  tickets,
  universeId,
  locale,
  isMobile,
  isBulkManagementEnabled,
  isSelectionMode,
  onTicketClick,
  onEnterSelectionMode,
  bulkActions,
  trailingActions,
  updateTimeSortOrder,
  onSortOrderChange,
}: PlayerSupportTableProps) => {
  const { translate } = useTranslation();
  // Selection freezes until a bulk action settles. The actions live outside this table,
  // hence the shared mutation key.
  const isBulkActionPending = useIsMutating({ mutationKey: BULK_MANAGE_TICKETS_MUTATION_KEY }) > 0;
  const isCardSelectionMode = isBulkManagementEnabled && isSelectionMode;

  if (isMobile) {
    return (
      <>
        {isBulkManagementEnabled && (
          <div className='items-center justify-between margin-top-medium gap-medium flex'>
            <Button
              variant='SoftEmphasis'
              size='Small'
              isDisabled={isSelectionMode || isBulkActionPending}
              onClick={onEnterSelectionMode}>
              {translate('Action.PlayerSupport.Select')}
            </Button>
            {trailingActions}
          </div>
        )}
        <div
          className={`margin-top-medium gap-[var(--size-1000)] flex flex-col ${
            isCardSelectionMode ? 'padding-bottom-[56px]' : ''
          }`}>
          {tickets.map((ticket, index) => (
            <MobileTicketCard
              key={ticket.creatorTicketId ?? `ticket-${index}`}
              ticket={ticket}
              universeId={universeId}
              locale={locale}
              isSelectionMode={isCardSelectionMode}
              isSelectionDisabled={isBulkActionPending}
              onClick={onTicketClick}
            />
          ))}
        </div>
        {isCardSelectionMode && bulkActions}
      </>
    );
  }

  return (
    <div className='stroke-default margin-top-medium stroke-thin radius-large clip'>
      <table className='width-full ![border-collapse:collapse]'>
        <thead>
          <tr className='height-1200 [border-bottom:var(--stroke-thin)_solid_var(--color-stroke-default)]'>
            <th className='content-emphasis text-label-medium text-align-x-left width-[50%] padding-x-medium'>
              <span className='items-center gap-small flex'>
                <span className='size-200 shrink-0' aria-hidden />
                {isBulkManagementEnabled && (
                  <span className='margin-right-small shrink-0'>
                    <PlayerSupportTableHeaderCheckbox
                      ariaLabel={translate('Title.Table.Details')}
                      isDisabled={isBulkActionPending}
                    />
                  </span>
                )}
                {translate('Title.Table.Details')}
              </span>
            </th>
            <th className='content-emphasis text-label-medium text-no-wrap text-align-x-left width-[176px] padding-x-medium'>
              {translate('Title.Table.Type')}
            </th>
            <th
              className='content-emphasis text-label-medium text-no-wrap text-align-x-left width-[176px] padding-x-medium'
              aria-sort={
                updateTimeSortOrder === CreatorTicketUpdateTimeSortOrder.Asc
                  ? 'ascending'
                  : 'descending'
              }>
              <div className='items-center gap-xsmall flex flex-row no-wrap'>
                {translate('Label.DetailsSidebar.LastUpdated')}
                <button
                  type='button'
                  className='items-center bg-none stroke-none padding-none margin-none cursor-pointer content-inherit flex focus-visible:outline-focus'
                  aria-label={translate('Label.DetailsSidebar.LastUpdated')}
                  onClick={onSortOrderChange}>
                  {updateTimeSortOrder === CreatorTicketUpdateTimeSortOrder.Asc ? (
                    <ArrowUpwardIcon className='content-default' fontSize='small' color='action' />
                  ) : (
                    <ArrowDownwardIcon
                      className='content-default'
                      fontSize='small'
                      color='action'
                    />
                  )}
                </button>
              </div>
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
              isSelectionDisabled={isBulkActionPending}
              onClick={onTicketClick}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PlayerSupportTable;
