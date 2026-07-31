import type { CreatorTicketSummary } from '@modules/clients/creatorCommunication';

export const getTicketId = (ticket: CreatorTicketSummary): string => ticket.creatorTicketId ?? '';

export const isTicketSelectable = (ticket: CreatorTicketSummary): boolean =>
  Boolean(ticket.creatorTicketId);

/** Selected tickets, read from the current page so item references stay fresh. */
export const getSelectedTicketIds = (
  items: readonly CreatorTicketSummary[],
  selectedMap: ReadonlyMap<string, CreatorTicketSummary>,
): string[] =>
  items.flatMap((ticket) =>
    ticket.creatorTicketId && selectedMap.has(ticket.creatorTicketId)
      ? [ticket.creatorTicketId]
      : [],
  );
