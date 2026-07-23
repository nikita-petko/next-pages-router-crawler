import type {
  CreatorTicketReadFilter,
  TicketCategory,
  TicketStatus,
} from '@modules/clients/creatorCommunication';

export interface PlayerSupportTicketsQueryKeyParams {
  universeId: number;
  status: TicketStatus;
  query?: string;
  readFilter?: CreatorTicketReadFilter;
  category?: TicketCategory;
  pageToken?: string;
  pageSize: number;
}

const getPlayerSupportTicketsQueryKey = ({
  universeId,
  status,
  query,
  readFilter,
  category,
  pageToken,
  pageSize,
}: PlayerSupportTicketsQueryKeyParams) =>
  [
    'playerSupportTickets',
    universeId,
    status,
    query,
    readFilter,
    category,
    pageToken,
    pageSize,
  ] as const;

export const getPlayerSupportTicketDetailQueryKey = (creatorTicketId: string) =>
  ['playerSupportTicketDetail', creatorTicketId] as const;

export const getPlayerSupportTicketUsernamesQueryKey = (userIds: readonly number[]) =>
  ['playerSupportTicketUsernames', [...userIds].toSorted((a, b) => a - b)] as const;

export default getPlayerSupportTicketsQueryKey;
