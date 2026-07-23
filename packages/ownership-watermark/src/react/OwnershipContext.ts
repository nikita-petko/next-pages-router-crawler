/**
 * React context for the ownership watermark.
 *
 * `OwnershipContext` carries the server-issued v3 opaque payload that the
 * renderer can embed. The `teamId` field is diagnostic-only (the payload bits
 * are minted server-side), and team ownership is now a ROS team id resolved by
 * the backend, so there is no team-slug registry context here anymore.
 *
 * This context is the bottom of the React layer in this package; the pure-TS
 * core in ../core owns the encode/decode and the schema, so Node-side consumers
 * never have to pull React into their bundle.
 */

import { createContext } from 'react';
import type { OwnershipPayloadV3 } from '../core';

export type OwnershipContextValue = {
  /** Server-issued opaque v3 token to embed. Without this, renderers skip. */
  payload: OwnershipPayloadV3 | null;
  /** Diagnostic metadata only; no longer used to build payload bits. */
  teamId?: number;
  /**
   * When false, a bare `<OwnershipWatermark />` renders nothing. There is no
   * environment- or bundler-level kill switch.
   */
  enabled: boolean;
};

export const OwnershipContext = createContext<OwnershipContextValue | null>(null);
