// These data models are tentative and may change as the backend API contract is finalized.
// TODO: Replace Date with Temporal after https://github.rbx.com/Roblox/creator-hub/pull/13197 merges.
import { z } from 'zod';
import { RAQIV2OperatingSystem, RAQIV2Platform } from '@rbx/creator-hub-analytics-config';

const ClientSessionDeviceSchema = z.object({
  // Reuse RAQIV2 dimension values for now; Client Sessions may need dedicated enums.
  platform: z.enum(RAQIV2Platform),
  operatingSystem: z.enum(RAQIV2OperatingSystem),
  memoryMB: z.int(),
});

export enum ClientSessionStatus {
  Unspecified = 'UNSPECIFIED',
  Active = 'ACTIVE',
  Ended = 'ENDED',
  Crashed = 'CRASHED',
}

export const ClientSessionSchema = z.object({
  id: z.string(),
  device: ClientSessionDeviceSchema,
  status: z.enum(ClientSessionStatus),
  startTime: z.date(),
  durationMinute: z.int().nonnegative(),
});

export type ClientSession = z.infer<typeof ClientSessionSchema>;

export enum ClientSessionLogSeverity {
  Output = 'Output',
  Info = 'Info',
  Warning = 'Warning',
  Error = 'Error',
}

export const ClientSessionLogSchema = z.object({
  id: z.string(),
  sessionId: ClientSessionSchema.shape.id,
  severity: z.enum(ClientSessionLogSeverity),
  message: z.string(),
  skipped: z.int().nonnegative(),
  createTime: z.date(),
});

export type ClientSessionLog = z.infer<typeof ClientSessionLogSchema>;
