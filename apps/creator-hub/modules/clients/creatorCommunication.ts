import { CreatorCommunicationServiceAPIApi } from '@rbx/client-creator-communication-service/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

const configuration = createClientConfiguration('creator-communication', 'bedev2');

const creatorCommunicationApi = new CreatorCommunicationServiceAPIApi(configuration);

export {
  TicketStatus,
  TicketCategory,
  TicketResponse,
  UserResponse,
  CreatorTicketReadFilter,
  CreatorTicketUpdateTimeSortOrder,
} from '@rbx/client-creator-communication-service/v1';
export type {
  CreatorTicket,
  CreatorTicketSummary,
  GetTicketAsCreatorResponse,
  ListCreatorTicketSummariesByStatusAndUniverseResponse,
  SearchCreatorTicketsResponse,
  ReportCreatorTicketRequest,
  ReportCreatorTicketResponse,
  UpdateTicketAsCreatorResponse,
  UpdateViewedByCreatorResponse,
} from '@rbx/client-creator-communication-service/v1';

export default creatorCommunicationApi;
