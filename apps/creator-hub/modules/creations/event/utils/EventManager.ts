import type { VirtualEventsClient, VirtualEventDetails } from '@modules/clients/virtualEvents';

export default class EventManager {
  private eventDetailsMap: Map<string, VirtualEventDetails>;

  constructor(private client: VirtualEventsClient) {
    this.eventDetailsMap = new Map();
  }

  async getEventDetails(
    eventId: string,
    shouldDataReload?: boolean,
  ): Promise<VirtualEventDetails | null> {
    if (!shouldDataReload && this.eventDetailsMap.has(eventId)) {
      return this.eventDetailsMap.get(eventId) ?? null;
    }
    try {
      const detailsResponse = await this.client.getEventById(eventId);
      if (detailsResponse) {
        this.eventDetailsMap.set(eventId, detailsResponse);
      }
      return detailsResponse;
    } catch {
      console.warn(`Could not fetch event details for eventId ${eventId}`);
      return null;
    }
  }

  forgetEvent(eventId: string): void {
    this.eventDetailsMap.delete(eventId);
  }
}
