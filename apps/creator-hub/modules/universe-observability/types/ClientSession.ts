// These data models are tentative and may change as the backend API contract is finalized.
// TODO: Replace Date with Temporal after https://github.rbx.com/Roblox/creator-hub/pull/13197 merges.
// https://roblox.atlassian.net/browse/DSA-6049
import { z } from 'zod';
import { RAQIV2OperatingSystem, RAQIV2Platform } from '@rbx/creator-hub-analytics-config';
import { LogSeverity } from './LogSeverity';

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

export enum ClientSessionDataAvailability {
  MicroProfiler = 'MICRO_PROFILER',
  DMR = 'DMR',
  MemoryDump = 'MEMORY_DUMP',
}

export const ClientSessionSchema = z.object({
  id: z.string(),
  device: ClientSessionDeviceSchema,
  status: z.enum(ClientSessionStatus),
  startTime: z.date(),
  durationMinute: z.int().nonnegative(),
  placeVersion: z.string(),
  placeName: z.string(),
  averageFps: z.number().nonnegative(),
  memoryUsageMB: z.number().nonnegative(),
  dataAvailability: z
    .array(z.enum(ClientSessionDataAvailability))
    .refine((availability) => new Set(availability).size === availability.length),
  // TODO: following metadata are listed in PRD
  // but we are not showing them anywhere on the UI (at least not for now)
  // can be added later once we figure out the visuals with design
  // https://roblox.atlassian.net/browse/DSA-6048
  // - associated bug report
  // - custom events triggered
});

export type ClientSession = z.infer<typeof ClientSessionSchema>;

export const ClientSessionLogSchema = z.object({
  id: z.string(),
  sessionId: ClientSessionSchema.shape.id,
  severity: z.enum(LogSeverity),
  message: z.string(),
  skipped: z.int().nonnegative(),
  createTime: z.date(),
});

export type ClientSessionLog = z.infer<typeof ClientSessionLogSchema>;
