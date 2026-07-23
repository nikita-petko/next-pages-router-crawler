import type { ManagedPricingEvent as RawManagedPricingEvent } from '@rbx/client-price-configuration-api/v1';
import type {
  ActiveManagedPricingEvent,
  CompletedManagedPricingEvent,
  CancelledManagedPricingEvent,
  FailedManagedPricingEvent,
  ManagedPricingEvent,
  UpcomingManagedPricingEvent,
} from '../types';

/**
 * Parses server response into strongly typed discriminated union for MP Events based on status.
 *
 * Note non-nullable assertions are guaranteed to exist server-side.
 */
// oxlint-disable typescript/no-non-null-assertion -- guaranteed typing server-side
export function parseManagedPricingEvent(event: RawManagedPricingEvent): ManagedPricingEvent {
  switch (event.status) {
    case 'Upcoming':
      return {
        id: event.id,
        eventType: event.eventType,
        eventReferenceId: event.eventReferenceId,
        status: event.status,
        startTime: event.startTime,
        endTime: null,
        totalProductCount: null,
        updatedProductCount: null,
        revenueLiftMicros: null,
      } satisfies UpcomingManagedPricingEvent;
    case 'Active':
      return {
        id: event.id,
        eventType: event.eventType,
        eventReferenceId: event.eventReferenceId,
        status: event.status,
        startTime: event.startTime!,
        endTime: event.endTime!,
        totalProductCount: event.totalProductCount!,
        updatedProductCount: null,
        revenueLiftMicros: null,
      } satisfies ActiveManagedPricingEvent;
    case 'Completed':
      return {
        id: event.id,
        eventType: event.eventType,
        eventReferenceId: event.eventReferenceId,
        status: event.status,
        startTime: event.startTime!,
        endTime: event.endTime!,
        totalProductCount: event.totalProductCount!,
        updatedProductCount: event.updatedProductCount!,
        revenueLiftMicros: event.revenueLiftMicros!,
      } satisfies CompletedManagedPricingEvent;
    case 'Cancelled':
      return {
        id: event.id,
        eventType: event.eventType,
        eventReferenceId: event.eventReferenceId,
        status: event.status,
        startTime: event.startTime!,
        endTime: event.endTime!,
        totalProductCount: event.totalProductCount,
        updatedProductCount: event.updatedProductCount,
        revenueLiftMicros: null,
      } satisfies CancelledManagedPricingEvent;
    default:
      return {
        id: event.id,
        eventType: event.eventType,
        eventReferenceId: event.eventReferenceId,
        status: 'Failed',
        startTime: event.startTime!,
        endTime: event.endTime!,
        totalProductCount: event.totalProductCount,
        updatedProductCount: event.updatedProductCount,
        revenueLiftMicros: null,
      } satisfies FailedManagedPricingEvent;
  }
}
