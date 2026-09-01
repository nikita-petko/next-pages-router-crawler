import { CreatorCommunicationServiceAPIApi } from '@rbx/client-creator-communication-service/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

const configuration = createClientConfiguration('creator-communication', 'bedev2');

const creatorCommunicationApi = new CreatorCommunicationServiceAPIApi(configuration);

export {
  BulkManageCreatorTicketResultStatus,
  BulkManageCreatorTicketsAction,
  TicketStatus,
  TicketCategory,
  TicketResponse,
  UserResponse,
  CreatorTicketReadFilter,
  CreatorTicketUpdateTimeSortOrder,
} from '@rbx/client-creator-communication-service/v1';
export type {
  BulkManageCreatorTicketResult,
  BulkManageCreatorTicketsRequest,
  BulkManageCreatorTicketsResponse,
  CreatorTicket,
  CreatorTicketExportRow,
  CreatorTicketSummary,
  ExportCreatorTicketsRequest,
  ExportCreatorTicketsResponse,
  GetTicketAsCreatorResponse,
  ListCreatorTicketSummariesByStatusAndUniverseResponse,
  SearchCreatorTicketsResponse,
  ReportCreatorTicketRequest,
  ReportCreatorTicketResponse,
  RerouteCreatorTicketToRobloxCSRequest,
  RerouteCreatorTicketToRobloxCSResponse,
  UpdateTicketAsCreatorResponse,
  UpdateViewedByCreatorResponse,
} from '@rbx/client-creator-communication-service/v1';

export default creatorCommunicationApi;
