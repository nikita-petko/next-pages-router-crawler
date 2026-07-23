/**
 * Event constants for cross-tab SignalR coordination.
 */

export const realtimeEvents = {
  // Notification event - published by master tab when it receives a SignalR notification
  Notification: 'Roblox.RealTime.Notification',

  // Connection event - published by master tab when connection status changes
  ConnectionEvent: 'Roblox.RealTime.ConnectionEvent',

  // Request for connection status - published by slave tabs on startup to get current state
  RequestForConnectionStatus: 'Roblox.RealTime.RequestForConnectionStatus',
} as const;

export type RealtimeEventType = (typeof realtimeEvents)[keyof typeof realtimeEvents];
