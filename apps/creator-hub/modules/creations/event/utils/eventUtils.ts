import type { TGroup } from '@modules/authentication/types';
import {
  EventMedia,
  EventRankedCategory,
  EventStatus,
  EventVisibility,
} from '@rbx/clients/virtualEventsApi';
import { Locale } from '@rbx/intl';
import { CreationData } from '../../common';
import maybeAppendQueryParam from './urlHelper';
import { EventThumbnail } from '../components/CreateEventForm/types';
import {
  eventCreationsSubtabs,
  ExperienceEventState,
  millisecondsInDay,
  millisecondsInHour,
  millisecondsInMinute,
  relativeTimeCutoff,
} from '../components/common/constants';

export const isPastEvent = (eventItem: CreationData): boolean => {
  return (
    (eventItem.eventStatus && eventItem.eventStatus === EventStatus.Cancelled) ||
    (eventItem.endTime && eventItem.endTime.getTime() < new Date().getTime()) ||
    false
  );
};

export const maybeAppendGroupIdToUrl = (
  targetPath: string,
  currentGroup: TGroup | null,
): string => {
  return maybeAppendQueryParam(targetPath, 'groupId', currentGroup?.id?.toString());
};

/**
 * Returns the URL of the event Configure Event page on Creator Hub
 *
 * @param universeId
 * @param eventId
 * @returns
 */
export const getConfigureEventUrl = (universeId: string | number, eventId: string | number) => {
  return `/dashboard/creations/experiences/${universeId}/events/${eventId}/configure`;
};

/**
 * Returns the URL of the event Create Event page for the universe on Creator Hub
 *
 * @param universeId
 * @returns
 */
export const getCreateEventUrl = (universeId: string | number) => {
  return `/dashboard/creations/experiences/${universeId}/events/create`;
};

/**
 *
 * @param eventId
 * @returns
 */
export const getEventDetailsUrl = (eventId: string | number) => {
  return `https://www.${process.env.robloxSiteDomain}/events/${eventId}`;
};

export const toRankedThumbnails = (thumbnails: EventThumbnail[]): EventMedia[] => {
  return thumbnails.map((thumbnail, index) => {
    if (!thumbnail.id) {
      return {};
    }
    return { mediaId: Number(thumbnail.id), rank: index };
  });
};

export const statusToVisibility = (status: string | EventStatus): EventVisibility => {
  if (status === EventStatus.Active) {
    return EventVisibility.Public;
  }
  if (status === EventStatus.Unpublished) {
    return EventVisibility.Private;
  }
  if (status === EventStatus.Moderated) {
    return EventVisibility.Moderated;
  }
  return EventVisibility.Private;
};

export const visibilityToStatus = (visibility: string | EventVisibility): EventStatus => {
  if (visibility === EventVisibility.Private) {
    return EventStatus.Unpublished;
  }
  if (visibility === EventVisibility.Public) {
    return EventStatus.Active;
  }
  if (visibility === EventVisibility.Moderated) {
    return EventStatus.Moderated;
  }
  return EventStatus.Unpublished;
};

export const eventStateToTiming = (state: ExperienceEventState) => {
  switch (state) {
    case ExperienceEventState.Scheduled:
      return {
        startsBeforeTime: undefined,
        startsAfterTime: new Date(),
        endsBeforeTime: undefined,
        endsAfterTime: undefined,
      };
    case ExperienceEventState.Finished:
      return {
        startsBeforeTime: undefined,
        startsAfterTime: undefined,
        endsBeforeTime: new Date(),
        endsAfterTime: undefined,
      };
    case ExperienceEventState.Active:
    default:
      return {
        startsBeforeTime: new Date(),
        startsAfterTime: undefined,
        endsBeforeTime: undefined,
        endsAfterTime: new Date(),
      };
  }
};

export const parseEventState = (state: string) => {
  switch (state) {
    case 'Scheduled':
      return ExperienceEventState.Scheduled;
    case 'Finished':
      return ExperienceEventState.Finished;
    case 'Active':
      return ExperienceEventState.Active;
    default:
      return null;
  }
};

export const getEventTabFromTiming = (startTime: Date, endTime: Date) => {
  const now = new Date();
  if (startTime > now) {
    return eventCreationsSubtabs.Scheduled;
  }
  if (endTime < now) {
    return eventCreationsSubtabs.Finished;
  }
  return eventCreationsSubtabs.Active;
};

/**
 * Function to get the display string to refer to a given date/time. Returns relative strings (ex. "3 days ago") for
 * close dates and absolute strings (ex. June 4, 2022) for far dates.
 *
 * @param targetTime The time being displayed
 * @param locale The user's locale
 * @returns Localized string referring to the target time
 */
export const toLocalizedTimeString = (targetTime: Date | undefined, locale: Locale) => {
  const currentTime = new Date();
  // Fallback if time fails to load
  if (!targetTime) {
    return '';
  }
  // Rule 1: If the target time is within 4 weeks, use relative time format
  const relativeTimeFormatter = new Intl.RelativeTimeFormat([locale?.toString() ?? 'en']);
  const timeDelta = targetTime.valueOf() - currentTime.valueOf();
  const absoluteTimeDelta = Math.abs(timeDelta);
  if (absoluteTimeDelta < relativeTimeCutoff * millisecondsInDay) {
    if (absoluteTimeDelta < millisecondsInHour) {
      return relativeTimeFormatter.format(Math.round(timeDelta / millisecondsInMinute), 'minute');
    }
    if (absoluteTimeDelta < millisecondsInDay) {
      return relativeTimeFormatter.format(Math.round(timeDelta / millisecondsInHour), 'hour');
    }
    if (absoluteTimeDelta < millisecondsInDay * 7) {
      return relativeTimeFormatter.format(Math.round(timeDelta / millisecondsInDay), 'day');
    }
    return relativeTimeFormatter.format(Math.round(timeDelta / (millisecondsInDay * 7)), 'week');
  }
  // Rule 2: If the target time is this year, do not include the year in the date
  const dateStringOptions: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  };
  if (targetTime.getFullYear() === currentTime.getFullYear()) {
    return targetTime.toLocaleString(locale?.toString() ?? 'en', dateStringOptions);
  }
  // Rule 3: Otherwise, include the year
  dateStringOptions.year = 'numeric';
  return targetTime.toLocaleString(locale?.toString() ?? 'en', dateStringOptions);
};

export const getEventCategory = (eventCategories: EventRankedCategory[] | null | undefined) => {
  if (!eventCategories || eventCategories?.length === 0) {
    return undefined;
  }
  return eventCategories[0].category;
};

export const getEventThumbnailId = (eventThumbnails: EventMedia[] | null | undefined) => {
  if (!eventThumbnails || eventThumbnails?.length === 0) {
    return undefined;
  }
  return eventThumbnails[0].mediaId;
};
