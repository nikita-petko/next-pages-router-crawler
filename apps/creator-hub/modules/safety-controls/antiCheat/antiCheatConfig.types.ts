// Types mirror the CONFaaS `EnhancedAntiCheat` namespace proto (`AntiCheatConfigProto`,
// package roblox.creatorexperienceconfig.validation.v1). Each namespace entry is keyed by
// `default` (universe-level) or `place_{place_id}` (place override); `default` uses the same
// schema as place overrides. The client below is keyed by placeId and the CONFaaS-backed
// implementation (P1a) is responsible for mapping that to the entry key.

/** Enforcement action applied to players in a trust bucket when hardware attestation is enabled. */
export enum AntiCheatEnforcementAction {
  Invalid = 0,
  /** Player joins normally; trust is measured but not acted on. */
  Ignore = 1,
  /** Join is routed through a server callback with the player's trust score. */
  Signal = 2,
  /** Player is prevented from joining (or kicked) with a resolution explanation. */
  Block = 3,
  /** Player still plays, but matchmaking routes them into a similar-trust pool. */
  Isolate = 4,
}

/**
 * Per-bucket hardware attestation enforcement policy (proto: AntiCheatHardwareAttestationPolicy).
 * Players are sorted into fixed trust buckets; each bucket gets an action. Every bucket is
 * required and must not be {@link AntiCheatEnforcementAction.Invalid} (proto `disallow_enum_zero_value`).
 */
export interface AntiCheatHardwareAttestationPolicy {
  /** Passed all attestation; strongest device-backed signal. */
  trusted: AntiCheatEnforcementAction;
  /** Passed everything the device supports; device lacks the strongest measures. */
  established: AntiCheatEnforcementAction;
  /** Passed some attestation; partial or weaker signal. */
  limited: AntiCheatEnforcementAction;
  /** Failed to pass any attestation. */
  untrusted: AntiCheatEnforcementAction;
}

/**
 * Hardware attestation config: exactly one of disabled/enabled is set (proto `oneof mode`).
 * Modeled as a discriminated union on `mode`. Used for the universal default and for the
 * optional per-platform overrides below.
 */
export type AntiCheatHardwareAttestationConfig =
  | { mode: 'disabled' }
  | { mode: 'enabled'; policy: AntiCheatHardwareAttestationPolicy };

/**
 * Windows platform settings (proto: AntiCheatWindowsOptions). `hardwareAttestation` optionally
 * overrides the universal default for Windows; omit it to inherit.
 */
export interface AntiCheatWindowsOptions {
  hardwareAttestation?: AntiCheatHardwareAttestationConfig;
  blockVirtualInput: boolean;
  blockHypervisors: boolean;
}

/**
 * Android platform settings (proto: AntiCheatAndroidOptions). `hardwareAttestation` optionally
 * overrides the universal default for Android; omit it to inherit.
 */
export interface AntiCheatAndroidOptions {
  hardwareAttestation?: AntiCheatHardwareAttestationConfig;
  blockVirtualInput: boolean;
  blockExternalInputDevices: boolean;
}

/**
 * macOS platform settings (proto: AntiCheatMacOSOptions) — an optional hardware attestation
 * override only. Omit `hardwareAttestation` to inherit the universal default for macOS.
 */
export interface AntiCheatMacOSOptions {
  hardwareAttestation?: AntiCheatHardwareAttestationConfig;
}

/**
 * iOS platform settings (proto: AntiCheatIOSOptions) — an optional hardware attestation override
 * only. Omit `hardwareAttestation` to inherit the universal default for iOS. Modeled separately
 * from {@link AntiCheatMacOSOptions} to mirror the proto, which splits the two so they can diverge.
 */
export interface AntiCheatIOSOptions {
  hardwareAttestation?: AntiCheatHardwareAttestationConfig;
}

/**
 * EnhancedAntiCheat namespace entry value (proto: AntiCheatEnhancedConfig). Hardware attestation
 * has a universal default; each platform may optionally override it inline. All platform blocks
 * are required.
 */
export interface AntiCheatEnhancedConfig {
  /** Universal hardware attestation default for Windows, Android, macOS, and iOS. */
  hardwareAttestation: AntiCheatHardwareAttestationConfig;
  windows: AntiCheatWindowsOptions;
  android: AntiCheatAndroidOptions;
  macos: AntiCheatMacOSOptions;
  ios: AntiCheatIOSOptions;
}

export interface AntiCheatConfigClient {
  getConfig(placeId: string): Promise<AntiCheatEnhancedConfig>;
  setConfig(placeId: string, config: AntiCheatEnhancedConfig): Promise<void>;
}
