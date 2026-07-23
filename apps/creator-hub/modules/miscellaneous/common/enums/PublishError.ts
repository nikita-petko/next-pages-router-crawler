// Numbers here must match Roblox.Publish.Api.PublishError enum values.
// So avoid reusing it if your errors are not from calling this API or its client.
export enum PublishError {
  UnknownError = 0, // An error that reserves the zero error code the base level. Do not use.
  InvalidFile = 1, // File format unsupported.
  MissingFile = 2, // No file in request.
  TooManyAttempts = 3, // Too many upload requests.
  InvalidItem = 4, // The target item being uploaded to is invalid or does not exist.
  InvalidPermissions = 5, // The user does not have permission to manage the item.
  NoRootPlace = 6, // The target universe has no root place.
  InvalidAssetType = 7, // The asset type is not appropriate for this request.
  InvalidQuotaResourceType = 8, // The resource type is not appropriate for this request.
}

export default PublishError;
