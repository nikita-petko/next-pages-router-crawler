import {
  AntiCheatEnforcementAction,
  type AntiCheatAndroidOptions,
  type AntiCheatEnhancedConfig,
  type AntiCheatHardwareAttestationConfig,
  type AntiCheatHardwareAttestationPolicy,
  type AntiCheatWindowsOptions,
} from './antiCheatConfig.types';

// The current UI is a single on/off toggle, but the proto models a much richer config
// (per-trust-bucket enforcement plus optional per-platform overrides). Until a dedicated
// multi-control UI is built, the toggle maps onto the full config here: "on" enables hardware
// attestation on the platform(s) we've launched support for (Android today) with a policy that
// blocks limited and untrusted devices; "off" disables it everywhere. The universal default is
// left disabled and enforcement is scoped per-platform on purpose, so a platform without launched
// support (e.g. Windows) can't inherit enforcement and lock its players out the moment that
// support ships.
// TODO: Replace this mapping with real per-control UI once the enhanced anti-cheat UX is designed.

/**
 * Policy applied when the toggle enables hardware attestation: block limited and untrusted devices,
 * ignore trusted and established ones.
 */
export const ENABLED_ATTESTATION_POLICY: AntiCheatHardwareAttestationPolicy = {
  trusted: AntiCheatEnforcementAction.Ignore,
  established: AntiCheatEnforcementAction.Ignore,
  limited: AntiCheatEnforcementAction.Block,
  untrusted: AntiCheatEnforcementAction.Block,
};

// Base platform option booleans. `hardwareAttestation` is applied separately in
// `buildEnhancedAntiCheatConfig` (Android gets the enabled policy when the toggle is on; every
// other platform inherits the disabled universal default).
const DEFAULT_WINDOWS_OPTIONS: AntiCheatWindowsOptions = {
  blockVirtualInput: false,
  blockHypervisors: false,
};
const DEFAULT_ANDROID_OPTIONS: AntiCheatAndroidOptions = {
  blockVirtualInput: false,
  blockExternalInputDevices: false,
};

// The toggle reflects whether hardware attestation is enabled on Android, the platform its
// enforcement is scoped to (see `buildEnhancedAntiCheatConfig`), rather than the universal default.
export const isEnhancedAntiCheatEnabled = (config: AntiCheatEnhancedConfig): boolean =>
  config.android.hardwareAttestation?.mode === 'enabled';

/** Build a complete, valid {@link AntiCheatEnhancedConfig} from the single toggle's state. */
export const buildEnhancedAntiCheatConfig = (isEnabled: boolean): AntiCheatEnhancedConfig => ({
  // Leave the universal default disabled and scope enforcement to Android below, so platforms
  // without launched support don't inherit blocking.
  hardwareAttestation: { mode: 'disabled' },
  windows: { ...DEFAULT_WINDOWS_OPTIONS },
  android: {
    ...(isEnabled
      ? { hardwareAttestation: { mode: 'enabled', policy: { ...ENABLED_ATTESTATION_POLICY } } }
      : {}),
    ...DEFAULT_ANDROID_OPTIONS,
  },
  macos: {},
  ios: {},
});

const cloneAttestation = (
  attestation: AntiCheatHardwareAttestationConfig,
): AntiCheatHardwareAttestationConfig =>
  attestation.mode === 'enabled'
    ? { mode: 'enabled', policy: { ...attestation.policy } }
    : { mode: 'disabled' };

const cloneWindowsOptions = (options: AntiCheatWindowsOptions): AntiCheatWindowsOptions => ({
  ...(options.hardwareAttestation
    ? { hardwareAttestation: cloneAttestation(options.hardwareAttestation) }
    : {}),
  blockVirtualInput: options.blockVirtualInput,
  blockHypervisors: options.blockHypervisors,
});

const cloneAndroidOptions = (options: AntiCheatAndroidOptions): AntiCheatAndroidOptions => ({
  ...(options.hardwareAttestation
    ? { hardwareAttestation: cloneAttestation(options.hardwareAttestation) }
    : {}),
  blockVirtualInput: options.blockVirtualInput,
  blockExternalInputDevices: options.blockExternalInputDevices,
});

// macOS and iOS share the same shape (an optional attestation override), so a single structural
// helper clones both; its result is assignable to AntiCheatMacOSOptions and AntiCheatIOSOptions.
const cloneAppleOptions = (options: {
  hardwareAttestation?: AntiCheatHardwareAttestationConfig;
}): { hardwareAttestation?: AntiCheatHardwareAttestationConfig } =>
  options.hardwareAttestation
    ? { hardwareAttestation: cloneAttestation(options.hardwareAttestation) }
    : {};

/** Deep-copy a config so stored/returned values can't be mutated by reference. */
export const cloneEnhancedAntiCheatConfig = (
  config: AntiCheatEnhancedConfig,
): AntiCheatEnhancedConfig => ({
  hardwareAttestation: cloneAttestation(config.hardwareAttestation),
  windows: cloneWindowsOptions(config.windows),
  android: cloneAndroidOptions(config.android),
  macos: cloneAppleOptions(config.macos),
  ios: cloneAppleOptions(config.ios),
});
