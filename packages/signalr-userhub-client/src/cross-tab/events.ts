/**
 * Event constants for cross-tab SignalR coordination.
 */

export const realtimeEvents = {
  // Notification event - published by master tab when it receives a SignalR notification
  Notification: 'Roblox.RealTime.Notification',
} as const;

export type RealtimeEventType = (typeof realtimeEvents)[keyof typeof realtimeEvents];
