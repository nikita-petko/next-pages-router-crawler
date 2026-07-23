// Numbers here must match Roblox.Api.Develop.Controllers.V1.AssetsError enum values.
// So avoid reusing it if your errors are not from calling this API or its client.
enum AssetError {
  Generic = 0, // Unknown error
  AssetDoesNotExist = 1, // The referenced asset does not exist.
  DoesNotHaveManagePermission = 3, // User does not have permissions to manage the asset.
  InvalidAssetId = 8, // AssetId is invalid.
  InvalidGenres = 9, // At least one genre should be specified.
  OnlyMarketplaceAssetsCanUpdateIsCopyingAllowed = 13, // Only a marketplace asset can be updated with IsCopyingAllowed.
  PackageCanNotUpdateIsCopyingAllowed = 14, //	Package can not update IsCopyingAllowed.
  InvalidName = 15, // The name of an Asset should not be empty.
  DescriptionTooLong = 16, // Description too long.
  TextModerated = 17, // Text moderated.
}

export default AssetError;
