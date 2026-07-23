import { DauBucket } from '@rbx/clients/contentLicensingApi/v1';

export enum MonitorType {
  MonitorOnly = 'monitor',
  MonitorAndRevshare = 'monitor-revshare',
}

/**
 * Internal representation of the minimum DAU.
 * API only has two values + undefined, which is not convenient for the frontend
 *
 * TS seemed happier with an object if we wanted to use the the API enum values in it.
 */
export const MinimumDAU = {
  NoRequirement: DauBucket.None,
  Small: DauBucket.Small,
  Large: DauBucket.Large,
};

export type MinimumDAUValue = (typeof MinimumDAU)[keyof typeof MinimumDAU];
