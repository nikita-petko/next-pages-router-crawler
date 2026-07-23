enum UniverseProductConfigurationErrorCode {
  InvalidTargetId = 1, // No corresponding L2.0 target for the target Id.
  ConfigMismatch = 2, // Missing product configuration for sale location.
  NoItemsEnabled = 3, // No enabled item for experience.
  Unknown = 4,
}

export default UniverseProductConfigurationErrorCode;
