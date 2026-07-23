// NOTE (@mbae, 03/12/24): https://github.rbx.com/Roblox/creator-notifications/blob/master/protos/roblox/creatornotifications/creatorstreamnotifications/v1beta1/creator_stream_notifications.proto
enum ENotificationTargetType {
  Invalid = 0,
  Universe = 1,
  User = 2,
  Static = 3,
  Asset = 4,
  Group = 5,
}

export default ENotificationTargetType;
