/*
 * Utility constants for calculations
 */

import { EventCategory } from '@rbx/clients/virtualEventsApi';

export const millisecondsInMinute = 60 * 1000;
export const millisecondsInHour = millisecondsInMinute * 60;
export const millisecondsInDay = millisecondsInHour * 24;
export const bytesPerKB = 1024;
export const bytesPerMB = bytesPerKB * 1024;

/*
 * Default form values
 */

export const defaultStartTimeOffset = 60 * millisecondsInMinute;
export const defaultEndTimeOffset = 2 * 60 * millisecondsInMinute;

/*
 * Navigation
 */

export enum ExperienceEventState {
  Active = 'Active',
  Scheduled = 'Scheduled',
  Finished = 'Finished',
}

export const eventCreationsSubtabs = {
  Active: {
    name: ExperienceEventState.Active,
    label: 'Label.Active',
  },
  Scheduled: {
    name: ExperienceEventState.Scheduled,
    label: 'Label.Scheduled',
  },
  Finished: {
    name: ExperienceEventState.Finished,
    label: 'Label.Finished',
  },
};

export const eventPageSize = 10;
export const tableStackViewBreakpoint = 'Large';
export const experienceEventsLearnMoreLink = `${process.env.baseUrl}/docs/production/promotion/experience-events`;

/*
 * Date formatting constants
 */

// The threshold for referring to a date/time relatively (ex '5 days ago') vs using the absolute date
export const relativeTimeCutoff = 4 * 7; // 4 weeks

/*
 * Form validation constants (SHOULD MATCH BACKEND)
 */

// Field error types (does not cover all possible field errors, but covers the ones that appear on this form)
export enum FieldErrorType {
  MaxLength = 'maxLength',
  MinLength = 'minLength',
  Max = 'max',
  Min = 'min',
  Pattern = 'pattern',
  Required = 'required',
}
// Size/length constants
export const minimumStartOffsetMinutes = 15;
export const minimumStartOffsetMs = minimumStartOffsetMinutes * millisecondsInMinute;
export const minimumEventDurationMinutes = 15;
export const minimumEventDurationMs = minimumEventDurationMinutes * millisecondsInMinute;
export const maximumEventDurationDays = 90;
export const maximumEventDurationMs = maximumEventDurationDays * millisecondsInDay;
export const maxTitleLength = 25;
export const maxSubtitleLength = 25;
export const maxTaglineLength = 120;
export const maxDescriptionLength = 1000;
export const minTimeOffsetForFeaturingDays = 7;
export const featuringDelayGracePeriodHours = 24;

// Thumbnail constants
export const maxNumberOfThumbnails = 5;
export const acceptedExperienceThumbnailFormats = ['jpg', 'jpeg', 'gif', 'png', 'tga', 'bmp'];
export const maxImageThumbnailSizeMB = 20;
export const thumbnailUploadPollingMaxRetries = 10;
export const thumbnailUploadPollingIntervalMS = 1000;

export const eventTypesM2 = [
  {
    key: 1,
    value: EventCategory.ContentUpdate,
    label: 'Label.EEContentUpdate',
    description: 'Label.EEContentUpdateExplain',
  },
  {
    key: 2,
    value: EventCategory.LocationUpdate,
    label: 'Label.EELocationUpdate',
    description: 'Label.EELocationUpdateExplain',
  },
  {
    key: 3,
    value: EventCategory.SystemUpdate,
    label: 'Label.EESystemUpdate',
    description: 'Label.EESystemUpdateExplain',
  },
  {
    key: 4,
    value: EventCategory.Activity,
    label: 'Label.EEActivity',
    description: 'Label.EEActivityExplain',
  },
];

export const eventCategoriesM3 = [
  {
    value: EventCategory.NewContent,
    label: 'Label.EENewContent',
  },
  {
    value: EventCategory.ItemDrop,
    label: 'Label.EEItemDrop',
  },
  {
    value: EventCategory.NewSeason,
    label: 'Label.EENewSeason',
  },
  {
    value: EventCategory.NewLocation,
    label: 'Label.EENewLocation',
  },
  {
    value: EventCategory.NewMap,
    label: 'Label.EENewMap',
  },
  {
    value: EventCategory.MoreLevels,
    label: 'Label.EEMoreLevels',
  },
  {
    value: EventCategory.NewFeature,
    label: 'Label.EENewFeature',
  },
  {
    value: EventCategory.EarlyAccess,
    label: 'Label.EEEarlyAccess',
  },
  {
    value: EventCategory.Expansion,
    label: 'Label.EEExpansion',
  },
  {
    value: EventCategory.Challenge,
    label: 'Label.EEChallenge',
  },
  {
    value: EventCategory.Quest,
    label: 'Label.EEQuest',
  },
  {
    value: EventCategory.Festival,
    label: 'Label.EEFestival',
  },
];
