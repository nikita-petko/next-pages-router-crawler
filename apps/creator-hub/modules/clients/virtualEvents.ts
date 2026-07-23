import type {
  VirtualEventsGetCreatorVirtualEventsRequest,
  UniversesV2GetUniverseVirtualEventsRequest,
  VirtualEventResponse,
  EventRankedCategory,
  EventCategory,
  EventMedia,
  EventVisibility,
  VirtualEventsUpdateVirtualEventRequest,
  UniversesGetUniverseEventOccurrencesRequest,
  FeaturingStatus,
} from '@rbx/client-virtual-events-api/v1';
import {
  VirtualEventsApi,
  UniversesV2Api,
  UniversesApi,
  EventStatus,
  SortOrder,
} from '@rbx/client-virtual-events-api/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export type GetMyEventsRequest = VirtualEventsGetCreatorVirtualEventsRequest;
export type VirtualEventDetails = VirtualEventResponse;
export const EventSortOrder = SortOrder;

export class VirtualEventsClient {
  private virtualEventsApi: VirtualEventsApi;

  private universesApi: UniversesApi;

  private universesV2Api: UniversesV2Api;

  constructor() {
    const configuration = createClientConfiguration('virtual-events', 'bedev2');

    this.virtualEventsApi = new VirtualEventsApi(configuration);
    this.universesV2Api = new UniversesV2Api(configuration);
    this.universesApi = new UniversesApi(configuration);
  }

  async getMyEvents(request: GetMyEventsRequest) {
    return this.virtualEventsApi.virtualEventsGetCreatorVirtualEvents(request);
  }

  async getUniverseEvents(request: UniversesV2GetUniverseVirtualEventsRequest) {
    return this.universesV2Api.universesV2GetUniverseVirtualEvents(request);
  }

  async getUniverseEventOccurances(request: UniversesGetUniverseEventOccurrencesRequest) {
    return this.universesApi.universesGetUniverseEventOccurrences(request);
  }

  async getEventById(eventId: string) {
    return this.virtualEventsApi.virtualEventsGetVirtualEvent({ id: eventId });
  }

  async createNewEvent(
    title: string,
    subtitle: string,
    description: string,
    start: Date,
    end: Date,
    thumbnails: EventMedia[],
    universeId: number,
    placeId: number,
    groupId: number | null,
    primaryEventType: EventCategory | '',
    secondaryEventType: EventCategory | '',
    visibility: EventVisibility,
    featuringStatus: FeaturingStatus,
    tagline: string,
  ) {
    const eventCategories: EventRankedCategory[] = [];

    if (primaryEventType) {
      eventCategories.push({
        category: primaryEventType,
        rank: 0,
      });
    }

    if (secondaryEventType) {
      eventCategories.push({
        category: secondaryEventType,
        rank: 1,
      });
    }

    return this.virtualEventsApi.virtualEventsCreateVirtualEvent({
      virtualEventsCreateVirtualEventRequest: {
        title,
        subtitle,
        description,
        eventTime: {
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        },
        thumbnails,
        universeId,
        placeId,
        groupId,
        eventCategories,
        visibility,
        featuringStatus,
        tagline,
      },
    });
  }

  async updateEvent(eventId: string, request: VirtualEventsUpdateVirtualEventRequest) {
    return this.virtualEventsApi.virtualEventsUpdateVirtualEvent({
      id: eventId,
      virtualEventsUpdateVirtualEventRequest: request,
    });
  }

  async publishEvent(eventId: string) {
    return this.virtualEventsApi.virtualEventsUpdateVirtualEventStatus({
      id: eventId,
      virtualEventsUpdateVirtualEventStatusRequest: {
        eventStatus: EventStatus.Active,
      },
    });
  }

  // Temporary until visibility is primary. This function allows for movement
  // back to draft/private (ARKS-1311 @rachel.anderson)
  async setEventStatus(eventId: string, status: EventStatus) {
    return this.virtualEventsApi.virtualEventsUpdateVirtualEventStatus({
      id: eventId,
      virtualEventsUpdateVirtualEventStatusRequest: {
        eventStatus: status,
      },
    });
  }

  async cancelEvent(eventId: string) {
    return this.virtualEventsApi.virtualEventsUpdateVirtualEventStatus({
      id: eventId,
      virtualEventsUpdateVirtualEventStatusRequest: {
        eventStatus: EventStatus.Cancelled,
      },
    });
  }

  async deleteEvent(eventId: string) {
    return this.virtualEventsApi.virtualEventsDeleteVirtualEvent({
      id: eventId,
    });
  }
}

const virtualEventsClient = new VirtualEventsClient();

export default virtualEventsClient;
