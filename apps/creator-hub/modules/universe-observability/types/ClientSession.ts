// TODO: Replace Date with Temporal after https://github.rbx.com/Roblox/creator-hub/pull/13197 merges.
// https://roblox.atlassian.net/browse/DSA-6049
import { z } from 'zod';
import { LogSeverity } from './LogSeverity';

export const ClientSessionLogSchema = z.object({
  // Client-generated id (the API does not return one). Used for React keys.
  id: z.string(),
  sessionId: z.string(),
  severity: z.enum(LogSeverity),
  message: z.string(),
  skipped: z.int().nonnegative(),
  createTime: z.date(),
  // TODO: stackTrace might also be structured
  // so it has clickable lines. but that part is TBD on the GSM side
  stackTrace: z.string().optional(),
});

export type ClientSessionLog = z.infer<typeof ClientSessionLogSchema>;
