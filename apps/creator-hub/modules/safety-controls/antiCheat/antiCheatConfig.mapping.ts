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
// attestation with a conservative default policy at the universal level; "off" disables it.
// Per-platform overrides are left unset so every platform inherits that universal default. These
// defaults are intentionally non-destructive (no hard BLOCK) so flipping the toggle can never
// lock players out.
// TODO: Replace this mapping with real per-control UI once the enhanced anti-cheat UX is designed.

/** Non-destructive default policy applied when the toggle enables hardware attestation. */
export const ENABLED_ATTESTATION_POLICY: AntiCheatHardwareAttestationPolicy = {
  trusted: AntiCheatEnforcementAction.Ignore,
  established: AntiCheatEnforcementAction.Ignore,
  limited: AntiCheatEnforcementAction.Signal,
  untrusted: AntiCheatEnforcementAction.Signal,
};

// Platform option defaults leave `hardwareAttestation` unset so each platform inherits the
// universal default, and apply no extra restrictions until the creator opts in via a real UI.
const DEFAULT_WINDOWS_OPTIONS: AntiCheatWindowsOptions = {
  blockVirtualInput: false,
  blockHypervisors: false,
};
const DEFAULT_ANDROID_OPTIONS: AntiCheatAndroidOptions = {
  blockVirtualInput: false,
  blockExternalInputDevices: false,
};

/** The toggle reflects whether hardware attestation is enabled at the universal level. */
export const isEnhancedAntiCheatEnabled = (config: AntiCheatEnhancedConfig): boolean =>
  config.hardwareAttestation.mode === 'enabled';

/** Build a complete, valid {@link AntiCheatEnhancedConfig} from the single toggle's state. */
export const buildEnhancedAntiCheatConfig = (isEnabled: boolean): AntiCheatEnhancedConfig => ({
  hardwareAttestation: isEnabled
    ? { mode: 'enabled', policy: { ...ENABLED_ATTESTATION_POLICY } }
    : { mode: 'disabled' },
  windows: { ...DEFAULT_WINDOWS_OPTIONS },
  android: { ...DEFAULT_ANDROID_OPTIONS },
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
