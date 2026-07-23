/**
 * Payload schema for the ownership watermark.
 *
 * v3 deliberately keeps semantic ownership packing on the backend. The visual
 * watermark only embeds compact server-issued attribution bytes plus a MAC;
 * this package treats `attributionData` as opaque token material.
 *
 * v3 layout (208 bits, MSB-first):
 *   bits   0..7      magic discriminator
 *   bits   8..11     payload version (=3)
 *   bits  12..15     codec profile (=1 for the current DWT/DCT + channel codec)
 *   bits  16..23     server signing key epoch
 *   bits  24..31     flags: high nibble attribution schema, low nibble reserved
 *   bits  32..127    opaque attribution data (96 bits)
 *   bits 128..191    truncated server MAC (64 bits)
 *   bits 192..207    CRC-16 over bits 0..191
 *
 * The CRC is a fast visual-decode discriminator. The MAC is not validated in
 * this package because the signing key belongs on the backend; analytics-it-
 * service validates it before resolving metadata.
 */

import { BitReader, BitWriter } from './bits';

const PAYLOAD_MAGIC_V3 = 179;
const PAYLOAD_MAGIC_BITS = 8;
const PAYLOAD_VERSION_BITS = 4;
const CODEC_PROFILE_BITS = 4;
const KEY_EPOCH_BITS = 8;
const FLAGS_BITS = 8;
const ATTRIBUTION_DATA_BYTES = 12;
const ATTRIBUTION_DATA_BITS = ATTRIBUTION_DATA_BYTES * 8;
const SERVER_MAC_BYTES = 8;
const SERVER_MAC_BITS = SERVER_MAC_BYTES * 8;
const CRC_BITS = 16;
const CRC_POLY = 0x1021;
const MAX_U8 = 255;

export const PAYLOAD_VERSION_V3 = 3;
export const PAYLOAD_VERSION = PAYLOAD_VERSION_V3;
export const WATERMARK_CODEC_PROFILE_V1 = 1;
export const WATERMARK_ATTRIBUTION_SCHEMA_V1 = 1;
export const WATERMARK_ATTRIBUTION_SCHEMA_FLAGS_V1 = WATERMARK_ATTRIBUTION_SCHEMA_V1 << 4;
export const PAYLOAD_BIT_LENGTH_V3 =
  PAYLOAD_MAGIC_BITS +
  PAYLOAD_VERSION_BITS +
  CODEC_PROFILE_BITS +
  KEY_EPOCH_BITS +
  FLAGS_BITS +
  ATTRIBUTION_DATA_BITS +
  SERVER_MAC_BITS +
  CRC_BITS;
export const PAYLOAD_BIT_LENGTH = PAYLOAD_BIT_LENGTH_V3;
export const ATTRIBUTION_DATA_BIT_LENGTH = ATTRIBUTION_DATA_BITS;
export const WATERMARK_SERVER_MAC_BIT_LENGTH = SERVER_MAC_BITS;

export type OwnershipPayloadV3 = {
  version: typeof PAYLOAD_VERSION_V3;
  codecProfile: typeof WATERMARK_CODEC_PROFILE_V1;
  keyEpoch: number;
  flags: number;
  attributionData: Uint8Array;
  serverMac: Uint8Array;
};

export type OwnershipPayload = OwnershipPayloadV3;

export type DecodePayloadFailureReason =
  | 'crc'
  | 'integrity'
  | 'unsupported_version'
  | 'unsupported_profile';

export type DecodedPayload =
  | { ok: true; payload: OwnershipPayload; rawBits: Uint8Array }
  | { ok: false; reason: DecodePayloadFailureReason; rawBits: Uint8Array };

export type DecodePayloadOptions = Record<string, never>;

export type CreateOpaqueOwnershipPayloadParams = {
  attributionData: Uint8Array;
  serverMac: Uint8Array;
  keyEpoch: number;
  flags?: number;
  codecProfile?: typeof WATERMARK_CODEC_PROFILE_V1;
};

function assertIntInRange(name: string, value: number, min: number, max: number): void {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(
      `encodePayload: ${name} must be an integer in [${String(min)}, ${String(max)}], got ${String(
        value,
      )}`,
    );
  }
}

function cloneFixedBytes(name: string, bytes: Uint8Array, expectedLength: number): Uint8Array {
  if (!(bytes instanceof Uint8Array)) {
    throw new Error(`encodePayload: ${name} must be a Uint8Array`);
  }
  if (bytes.length !== expectedLength) {
    throw new Error(
      `encodePayload: ${name} must be ${String(expectedLength)} bytes, got ${String(bytes.length)}`,
    );
  }
  return Uint8Array.from(bytes);
}

function writeByteArray(writer: BitWriter, bytes: Uint8Array): void {
  for (const byte of bytes) {
    writer.writeBits(byte, 8);
  }
}

function readByteArray(reader: BitReader, byteLength: number): Uint8Array {
  const out = new Uint8Array(byteLength);
  for (let i = 0; i < byteLength; i += 1) {
    out[i] = reader.readBits(8);
  }
  return out;
}

function bitsToUint(bits: ArrayLike<number>): number {
  let v = 0;
  for (const bit of Array.from(bits)) {
    v = (v << 1) | (bit & 1);
  }
  return v;
}

function crc16(bits: ArrayLike<number>): number {
  let reg = 65535;
  for (const bit of Array.from(bits)) {
    const top = (reg >> 15) & 1;
    reg = ((reg << 1) & 65535) | (bit & 1);
    if (top === 1) {
      reg ^= CRC_POLY;
    }
  }
  for (let i = 0; i < CRC_BITS; i += 1) {
    const top = (reg >> 15) & 1;
    reg = (reg << 1) & 65535;
    if (top === 1) {
      reg ^= CRC_POLY;
    }
  }
  return reg & 65535;
}

export function createOpaqueOwnershipPayload({
  attributionData,
  serverMac,
  keyEpoch,
  flags = WATERMARK_ATTRIBUTION_SCHEMA_FLAGS_V1,
  codecProfile = WATERMARK_CODEC_PROFILE_V1,
}: CreateOpaqueOwnershipPayloadParams): OwnershipPayloadV3 {
  assertIntInRange('keyEpoch', keyEpoch, 0, MAX_U8);
  assertIntInRange('flags', flags, 0, MAX_U8);
  if (codecProfile !== WATERMARK_CODEC_PROFILE_V1) {
    throw new Error(
      `encodePayload: codecProfile must be ${String(WATERMARK_CODEC_PROFILE_V1)}, got ${String(
        codecProfile,
      )}`,
    );
  }
  return {
    version: PAYLOAD_VERSION_V3,
    codecProfile,
    keyEpoch,
    flags,
    attributionData: cloneFixedBytes('attributionData', attributionData, ATTRIBUTION_DATA_BYTES),
    serverMac: cloneFixedBytes('serverMac', serverMac, SERVER_MAC_BYTES),
  };
}

export function encodePayload(payload: OwnershipPayload): Uint8Array {
  const { version }: { version: number } = payload;
  if (version !== PAYLOAD_VERSION_V3) {
    throw new Error(
      `encodePayload: version must be ${String(PAYLOAD_VERSION_V3)}, got ${String(version)}`,
    );
  }
  if (payload.codecProfile !== WATERMARK_CODEC_PROFILE_V1) {
    throw new Error(
      `encodePayload: codecProfile must be ${String(WATERMARK_CODEC_PROFILE_V1)}, got ${String(
        payload.codecProfile,
      )}`,
    );
  }
  assertIntInRange('keyEpoch', payload.keyEpoch, 0, MAX_U8);
  assertIntInRange('flags', payload.flags, 0, MAX_U8);
  const attributionData = cloneFixedBytes(
    'attributionData',
    payload.attributionData,
    ATTRIBUTION_DATA_BYTES,
  );
  const serverMac = cloneFixedBytes('serverMac', payload.serverMac, SERVER_MAC_BYTES);

  const writer = new BitWriter();
  writer.writeBits(PAYLOAD_MAGIC_V3, PAYLOAD_MAGIC_BITS);
  writer.writeBits(PAYLOAD_VERSION_V3, PAYLOAD_VERSION_BITS);
  writer.writeBits(payload.codecProfile, CODEC_PROFILE_BITS);
  writer.writeBits(payload.keyEpoch, KEY_EPOCH_BITS);
  writer.writeBits(payload.flags, FLAGS_BITS);
  writeByteArray(writer, attributionData);
  writeByteArray(writer, serverMac);

  const prefix = writer.toArray();
  const withCrc = new BitWriter();
  for (const bit of prefix) {
    withCrc.writeBits(bit, 1);
  }
  withCrc.writeBits(crc16(prefix), CRC_BITS);
  const bits = withCrc.toArray();
  if (bits.length !== PAYLOAD_BIT_LENGTH_V3) {
    throw new Error(
      `encodePayload: produced ${String(bits.length)} bits, expected ${String(
        PAYLOAD_BIT_LENGTH_V3,
      )}`,
    );
  }
  return bits;
}

export function decodePayload(bits: ArrayLike<number>): DecodedPayload {
  if (bits.length !== PAYLOAD_BIT_LENGTH_V3) {
    throw new Error(
      `decodePayload: expected ${String(PAYLOAD_BIT_LENGTH_V3)}-bit payload, got ${String(
        bits.length,
      )}`,
    );
  }
  const raw = Uint8Array.from({ length: bits.length }, (_, i) => bits[i] & 1);
  const prefixLength = bits.length - CRC_BITS;
  const prefix = raw.slice(0, prefixLength);
  const crcFromBits = bitsToUint(raw.slice(prefixLength));
  if (crcFromBits !== crc16(prefix)) {
    return { ok: false, reason: 'crc', rawBits: raw };
  }

  const reader = new BitReader(prefix);
  const magic = reader.readBits(PAYLOAD_MAGIC_BITS);
  if (magic !== PAYLOAD_MAGIC_V3) {
    return { ok: false, reason: 'integrity', rawBits: raw };
  }
  const version = reader.readBits(PAYLOAD_VERSION_BITS);
  if (version !== PAYLOAD_VERSION_V3) {
    return { ok: false, reason: 'unsupported_version', rawBits: raw };
  }
  const codecProfile = reader.readBits(CODEC_PROFILE_BITS);
  if (codecProfile !== WATERMARK_CODEC_PROFILE_V1) {
    return { ok: false, reason: 'unsupported_profile', rawBits: raw };
  }

  return {
    ok: true,
    payload: {
      version: PAYLOAD_VERSION_V3,
      codecProfile: WATERMARK_CODEC_PROFILE_V1,
      keyEpoch: reader.readBits(KEY_EPOCH_BITS),
      flags: reader.readBits(FLAGS_BITS),
      attributionData: readByteArray(reader, ATTRIBUTION_DATA_BYTES),
      serverMac: readByteArray(reader, SERVER_MAC_BYTES),
    },
    rawBits: raw,
  };
}
