import { Locale } from '@rbx/intl';
import StudioTheme from '../enums/StudioTheme';

export interface RequestResponseParams<TRequestParams, TResponseParams> {
  requestParams: TRequestParams;
  responseParams: TResponseParams;
}

export type EmptyParams = Record<string, never> | void;

export interface InternalChangeThemeRequestParams {
  theme: StudioTheme;
}

export interface InternalChangeVolumeRequestParams {
  volume: number;
}

export interface InternalInitRequestParams {
  capabilities: string[];
}

export interface InternalInitResponseParams {
  capabilities: string[];
  metadata?: Record<string, string>; // Optional object to store metadata from Studio (ex: studioSid, placeId, etc)
}

export interface BaseEventTypes {
  'internal:changeTheme': RequestResponseParams<InternalChangeThemeRequestParams, EmptyParams>;
  'internal:changeVolume': RequestResponseParams<InternalChangeVolumeRequestParams, EmptyParams>;
  'internal:init': RequestResponseParams<InternalInitRequestParams, InternalInitResponseParams>;
}

export type MessageName = keyof BaseEventTypes;

export type TMessageCallback<TRequestParams, TResponseParams> = (
  data: TRequestParams,
) => TResponseParams;

export enum MessageBusEventType {
  Fire = 'fire',
  Response = 'response',
  Request = 'request',
}

export type MessageBusEventMetadata = {
  type: MessageBusEventType;
  uuid?: string;
};

export type TMessageBusCallback<TRequestParams> = (
  messageBusEventData: TRequestParams,
  eventMetadata: MessageBusEventMetadata,
) => void;

export type StudioConfiguration = {
  theme: StudioTheme; // initial theme when the web app loads in, refreshed on reload
  locale: Locale;
  isPrewarm: boolean; // Indicates if this is initialized as a prewarm instance to avoid unnecessary initialization/errors
  osPlatform?: string;
  osVersion?: string;
  volume?: number; // initial volume when the web app loads in, refreshed on reload
};
