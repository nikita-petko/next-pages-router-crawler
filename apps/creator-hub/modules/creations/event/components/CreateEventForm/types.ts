import { EventCategory, EventVisibility } from '@rbx/clients/virtualEventsApi';
import {
  defaultEndTimeOffset,
  defaultStartTimeOffset,
  maxDescriptionLength,
  maximumEventDurationMs,
  maxSubtitleLength,
  maxTaglineLength,
  maxTitleLength,
  minimumEventDurationMs,
} from '../common/constants';

// ID will be undefined for thumbnails that have not been uploaded yet
export type EventThumbnail = {
  id?: number;
  url?: string;
  file?: File;
};

export type CreateEventFormType = {
  title: string;
  subtitle: string;
  description: string;
  tagline: string;
  startTime: Date;
  endTime: Date;
  universeId: number | null;
  placeId: number;
  primaryEventType: EventCategory | '';
  secondaryEventType: EventCategory | '';
  visibility: EventVisibility;
  thumbnails: Array<EventThumbnail>;
  featuringOptInStatus: boolean; // todo: change to enum

  // More fields go here

  shouldPublish: boolean;
  id: string | undefined;
  correlationId: string | undefined;
};

// Time is validated based on the user's system time. This will not necessarily
// match the backend validation, so if possible it would be good to change this.

export const CreateEventRegisterOptions = {
  title: {
    required: 'Message.RequiredFieldMissed',
    maxLength: maxTitleLength,
  },
  subtitle: {
    required: 'Message.RequiredFieldMissed',
    maxLength: maxSubtitleLength,
  },
  description: { maxLength: maxDescriptionLength },
  startTime: (
    isActive: boolean | undefined | null,
    startDirty: boolean | undefined,
    endDirty: boolean | undefined,
  ) => ({
    required: 'Message.RequiredFieldMissing',
    min:
      // Rule: Rescheduled events must start in the future, but if the timing is unchanged updates are still allowed.
      // Extending or shortening a currently running event is also allowed, if the start time is unchanged.
      startDirty || (!isActive && endDirty) ? new Date().getTime() : undefined,
    validate: (startTime: Date) => startTime instanceof Date && !Number.isNaN(startTime.getTime()),
  }),
  endTime: (startTime: Date) => {
    const invalidStartTime = !(startTime instanceof Date) || Number.isNaN(startTime.getTime());
    const currentTimeMs = new Date().getTime();
    const validateFn = (endTime: Date) =>
      endTime instanceof Date && !Number.isNaN(endTime.getTime());

    if (invalidStartTime) {
      return {
        required: 'Message.RequiredFieldMissing',
        // Rule: If the start time invalid, we default to the current time as the minumum
        min: currentTimeMs,
        max: undefined,
        validate: validateFn,
      };
    }

    // Start time is valid... so we can use it
    const startTimeMs = startTime.getTime();
    const minimumStartTimeMs = startTimeMs + minimumEventDurationMs; // The soonest the event can start is start time + minimum duration
    const maximumStartTimeMs = startTimeMs + maximumEventDurationMs; // The latest the event can start is start time + maximum duration
    const hasStartTimePassed = currentTimeMs > minimumStartTimeMs;

    return {
      required: 'Message.RequiredFieldMissing',
      // Rule: If the start time is in the past, we default to the current time as the minumum
      min: hasStartTimePassed ? currentTimeMs : minimumStartTimeMs,
      max: maximumStartTimeMs,
      validate: validateFn,
    };
  },
  primaryEventType: {
    required: 'Message.RequiredFieldMissed',
  },
  universeId: { required: 'Message.RequiredFieldMissing' },
  tagline: (featuringEnabled: boolean) => {
    return {
      required: featuringEnabled,
      maxLength: featuringEnabled ? maxTaglineLength : undefined,
    };
  },
};

export const CreateEventFormDefaultValues: CreateEventFormType = {
  title: '',
  subtitle: '',
  description: '',
  tagline: '',
  startTime: new Date(new Date().getTime() + defaultStartTimeOffset),
  endTime: new Date(new Date().getTime() + defaultEndTimeOffset),
  universeId: null,
  placeId: 0,
  primaryEventType: '',
  secondaryEventType: '',
  shouldPublish: false,
  id: undefined,
  correlationId: undefined,
  thumbnails: [],
  featuringOptInStatus: false,
  visibility: EventVisibility.Private,
};
