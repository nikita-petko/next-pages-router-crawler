enum ConfigureSocialLinkErrorCodes {
  Unauthorized = 0,
  NoPermission = 1,
  TitleTooLong = 2,
  TitleEmpty = 3,
  UrlEmpty = 4,
  UrlWrongFormat = 5,
  MalformedRequest = 6,
  LinkNotFound = 7,
  TypeInvalid = 8,
  RequestCannotBeProcessed = 10,
  TitleModerated = 11,
  InsufficientGroupPermission = 18,
}

export default ConfigureSocialLinkErrorCodes;
