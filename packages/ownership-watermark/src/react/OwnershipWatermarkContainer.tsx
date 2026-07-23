/**
 * Shared wrapper for non-ChartCard surfaces that need the watermark.
 *
 * Use this around Activity Feed grids, Open Cloud item grids, translation
 * tables -- anywhere there isn't an existing `ChartCard`-style container to
 * bake the watermark into.
 *
 * This component intentionally does nothing clever -- it's just a
 * `position: relative` wrapper with the watermark pinned to the bottom.
 * Kept separate from OwnershipWatermark itself so feature modules can opt in
 * without having to restructure their layout.
 */

import React, { type ReactNode } from 'react';
import type { OwnershipPayloadV3 } from '../core';
import OwnershipWatermark from './OwnershipWatermark';

export type OwnershipWatermarkContainerProps = {
  /** Tag name for the wrapper element. Defaults to 'div'. */
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  style?: React.CSSProperties;
  payload?: OwnershipPayloadV3 | null;
  children: ReactNode;
};

const OwnershipWatermarkContainer: React.FC<OwnershipWatermarkContainerProps> = ({
  as = 'div',
  className,
  style,
  payload,
  children,
}) => {
  return React.createElement(
    as,
    { className, style: { position: 'relative', ...style } },
    children,
    <OwnershipWatermark payload={payload} />,
  );
};

export default OwnershipWatermarkContainer;
