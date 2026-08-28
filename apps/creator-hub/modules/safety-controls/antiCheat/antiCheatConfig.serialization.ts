// (De)serialization between the in-app {@link AntiCheatEnhancedConfig} and the CONFaaS wire value.
// The creator-configs-public-api stores each entry value as a proto3-JSON struct of
// `AntiCheatEnhancedConfig` (package roblox.creatorexperienceconfig.validation.v1): field names are
// the proto's snake_case names, enums are their SCREAMING_SNAKE value names, and the hardware
// attestation `oneof` is `{ "disabled": {} }` or `{ "enabled": { <policy> } }`. The C# validator
// (EnhancedAntiCheatValidator) reads exactly this shape, so these helpers must match it verbatim.

import {
  AntiCheatEnforcementAction,
  type AntiCheatAndroidOptions,
  type AntiCheatEnhancedConfig,
  type AntiCheatHardwareAttestationConfig,
  type AntiCheatHardwareAttestationPolicy,
  type AntiCheatWindowsOptions,
} from './antiCheatConfig.types';

const ENFORCEMENT_ACTION_TO_WIRE: Record<AntiCheatEnforcementAction, string> = {
  [AntiCheatEnforcementAction.Invalid]: 'ANTI_CHEAT_ENFORCEMENT_ACTION_INVALID',
  [AntiCheatEnforcementAction.Ignore]: 'ANTI_CHEAT_ENFORCEMENT_ACTION_IGNORE',
  [AntiCheatEnforcementAction.Signal]: 'ANTI_CHEAT_ENFORCEMENT_ACTION_SIGNAL',
  [AntiCheatEnforcementAction.Block]: 'ANTI_CHEAT_ENFORCEMENT_ACTION_BLOCK',
  [AntiCheatEnforcementAction.Isolate]: 'ANTI_CHEAT_ENFORCEMENT_ACTION_ISOLATE',
};

const WIRE_TO_ENFORCEMENT_ACTION: Record<string, AntiCheatEnforcementAction> = {
  ANTI_CHEAT_ENFORCEMENT_ACTION_INVALID: AntiCheatEnforcementAction.Invalid,
  ANTI_CHEAT_ENFORCEMENT_ACTION_IGNORE: AntiCheatEnforcementAction.Ignore,
  ANTI_CHEAT_ENFORCEMENT_ACTION_SIGNAL: AntiCheatEnforcementAction.Signal,
  ANTI_CHEAT_ENFORCEMENT_ACTION_BLOCK: AntiCheatEnforcementAction.Block,
  ANTI_CHEAT_ENFORCEMENT_ACTION_ISOLATE: AntiCheatEnforcementAction.Isolate,
};

/** Thrown when a CONFaaS entry value does not match the EnhancedAntiCheat schema. */
export class AntiCheatConfigWireError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AntiCheatConfigWireError';
  }
}

// ---------------------------------------------------------------------------
// Serialize: AntiCheatEnhancedConfig -> proto3-JSON struct
// ---------------------------------------------------------------------------

const serializeAttestation = (
  attestation: AntiCheatHardwareAttestationConfig,
): Record<string, unknown> => {
  if (attestation.mode === 'disabled') {
    return { disabled: {} };
  }
  return {
    enabled: {
      trusted: ENFORCEMENT_ACTION_TO_WIRE[attestation.policy.trusted],
      established: ENFORCEMENT_ACTION_TO_WIRE[attestation.policy.established],
      limited: ENFORCEMENT_ACTION_TO_WIRE[attestation.policy.limited],
      untrusted: ENFORCEMENT_ACTION_TO_WIRE[attestation.policy.untrusted],
    },
  };
};

const serializeWindows = (options: AntiCheatWindowsOptions): Record<string, unknown> => ({
  ...(options.hardwareAttestation
    ? { hardware_attestation: serializeAttestation(options.hardwareAttestation) }
    : {}),
  block_virtual_input: options.blockVirtualInput,
  block_hypervisors: options.blockHypervisors,
});

const serializeAndroid = (options: AntiCheatAndroidOptions): Record<string, unknown> => ({
  ...(options.hardwareAttestation
    ? { hardware_attestation: serializeAttestation(options.hardwareAttestation) }
    : {}),
  block_virtual_input: options.blockVirtualInput,
  block_external_input_devices: options.blockExternalInputDevices,
});

// macOS and iOS share the same shape (an optional attestation override), so one structural
// helper serializes both.
const serializeApple = (options: {
  hardwareAttestation?: AntiCheatHardwareAttestationConfig;
}): Record<string, unknown> =>
  options.hardwareAttestation
    ? { hardware_attestation: serializeAttestation(options.hardwareAttestation) }
    : {};

/** Serialize a config to the CONFaaS entry value (proto3-JSON struct). */
export const serializeEnhancedAntiCheatConfig = (
  config: AntiCheatEnhancedConfig,
): Record<string, unknown> => ({
  hardware_attestation: serializeAttestation(config.hardwareAttestation),
  windows: serializeWindows(config.windows),
  android: serializeAndroid(config.android),
  macos: serializeApple(config.macos),
  ios: serializeApple(config.ios),
});

// ---------------------------------------------------------------------------
// Deserialize: proto3-JSON struct -> AntiCheatEnhancedConfig
// ---------------------------------------------------------------------------

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const requireRecord = (value: unknown, path: string): Record<string, unknown> => {
  if (!isRecord(value)) {
    throw new AntiCheatConfigWireError(`Expected an object at ${path}`);
  }
  return value;
};

const requireBool = (value: unknown, path: string): boolean => {
  if (typeof value !== 'boolean') {
    throw new AntiCheatConfigWireError(`Expected a boolean at ${path}`);
  }
  return value;
};

const parseEnforcementAction = (value: unknown, path: string): AntiCheatEnforcementAction => {
  if (typeof value === 'string') {
    const mapped = WIRE_TO_ENFORCEMENT_ACTION[value];
    // Invalid (enum zero) is disallowed by the proto, so reject it like any other bad value.
    if (mapped !== undefined && mapped !== AntiCheatEnforcementAction.Invalid) {
      return mapped;
    }
  }
  throw new AntiCheatConfigWireError(
    `Invalid enforcement action at ${path}: ${JSON.stringify(value)}`,
  );
};

const parseAttestation = (value: unknown, path: string): AntiCheatHardwareAttestationConfig => {
  const record = requireRecord(value, path);
  if (record.enabled !== undefined) {
    const policyRecord = requireRecord(record.enabled, `${path}.enabled`);
    const policy: AntiCheatHardwareAttestationPolicy = {
      trusted: parseEnforcementAction(policyRecord.trusted, `${path}.enabled.trusted`),
      established: parseEnforcementAction(policyRecord.established, `${path}.enabled.established`),
      limited: parseEnforcementAction(policyRecord.limited, `${path}.enabled.limited`),
      untrusted: parseEnforcementAction(policyRecord.untrusted, `${path}.enabled.untrusted`),
    };
    return { mode: 'enabled', policy };
  }
  if (record.disabled !== undefined) {
    return { mode: 'disabled' };
  }
  throw new AntiCheatConfigWireError(`Hardware attestation oneof not set at ${path}`);
};

const parseOptionalAttestation = (
  value: unknown,
  path: string,
): AntiCheatHardwareAttestationConfig | undefined =>
  value === undefined ? undefined : parseAttestation(value, path);

const parseWindows = (value: unknown, path: string): AntiCheatWindowsOptions => {
  const record = requireRecord(value, path);
  const hardwareAttestation = parseOptionalAttestation(
    record.hardware_attestation,
    `${path}.hardware_attestation`,
  );
  return {
    ...(hardwareAttestation ? { hardwareAttestation } : {}),
    blockVirtualInput: requireBool(record.block_virtual_input, `${path}.block_virtual_input`),
    blockHypervisors: requireBool(record.block_hypervisors, `${path}.block_hypervisors`),
  };
};

const parseAndroid = (value: unknown, path: string): AntiCheatAndroidOptions => {
  const record = requireRecord(value, path);
  const hardwareAttestation = parseOptionalAttestation(
    record.hardware_attestation,
    `${path}.hardware_attestation`,
  );
  return {
    ...(hardwareAttestation ? { hardwareAttestation } : {}),
    blockVirtualInput: requireBool(record.block_virtual_input, `${path}.block_virtual_input`),
    blockExternalInputDevices: requireBool(
      record.block_external_input_devices,
      `${path}.block_external_input_devices`,
    ),
  };
};

const parseApple = (
  value: unknown,
  path: string,
): { hardwareAttestation?: AntiCheatHardwareAttestationConfig } => {
  const record = requireRecord(value, path);
  const hardwareAttestation = parseOptionalAttestation(
    record.hardware_attestation,
    `${path}.hardware_attestation`,
  );
  return hardwareAttestation ? { hardwareAttestation } : {};
};

/** Deserialize a CONFaaS entry value into a config, throwing on any schema mismatch. */
export const deserializeEnhancedAntiCheatConfig = (value: unknown): AntiCheatEnhancedConfig => {
  const root = requireRecord(value, 'config');
  return {
    hardwareAttestation: parseAttestation(root.hardware_attestation, 'config.hardware_attestation'),
    windows: parseWindows(root.windows, 'config.windows'),
    android: parseAndroid(root.android, 'config.android'),
    macos: parseApple(root.macos, 'config.macos'),
    ios: parseApple(root.ios, 'config.ios'),
  };
};
