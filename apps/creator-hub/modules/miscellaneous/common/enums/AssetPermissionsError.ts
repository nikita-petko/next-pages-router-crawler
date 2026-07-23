enum AssetPermissionsError {
  UnknownError = 'UnknownError',
  InvalidRequest = 'InvalidRequest',
  AssetNotFound = 'AssetNotFound',
  CannotManageAsset = 'CannotManageAsset',
  PublicAssetCannotBeGrantedTo = 'PublicAssetCannotBeGrantedTo',
  CannotManageSubject = 'CannotManageSubject',
  SubjectNotFound = 'SubjectNotFound',
  AssetTypeNotEnabled = 'AssetTypeNotEnabled',
}

export default AssetPermissionsError;
