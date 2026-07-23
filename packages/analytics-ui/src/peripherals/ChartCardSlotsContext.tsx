/**
 * Pluggable decoration slots for `ChartCard`.
 *
 * Why this exists: `analytics-ui` is a generic presentational package --
 * it must not depend on product-specific features such as the ownership
 * watermark. Earlier iterations wired `<OwnershipWatermark />` directly
 * into `ChartCard`, which forced `@rbx/analytics-ui` to take a peer
 * dependency on `@rbx/ownership-watermark`. That coupling runs
 * the wrong direction: a UI-primitives package should not know anything
 * about product telemetry.
 *
 * This context is the seam. Apps that need the watermark (creator-hub)
 * can mount `ChartCardSlotsProvider` near the root with a fallback
 * `{ watermark: <OwnershipWatermark /> }`; ChartCard looks up the slot
 * from context and renders it as an overlay child. Individual chart
 * containers can also pass a per-card `slots` prop when they know a more
 * specific owner (for example, metric-based attribution). Consumers that
 * don't care (Storybook, tests, decoder tooling)
 * see `slots.watermark === undefined` and ChartCard skips the overlay
 * entirely. Zero product coupling on this side of the seam.
 *
 * Per-card override: `ChartCard` also accepts a `slots` prop that wins
 * over the context value. That's the escape hatch for stories/tests
 * that want to inject a stand-in or for feature modules that need a
 * different decoration on a specific card (metric-owned watermark)
 * without changing the app-wide default.
 *
 * Design-space notes:
 *   - `watermark` is typed as `ReactNode`, not `ComponentType`. Callers
 *     pass an element (`<OwnershipWatermark />`), which ChartCard
 *     renders in every card's tree. Each card instance gets its own
 *     fiber / ref / effect closure even though the element literal is
 *     shared -- that's standard React semantics, not a pitfall.
 *   - The slot shape is deliberately narrow (`watermark?` only) rather
 *     than a generic `Record<string, ReactNode>`. Narrow is cheaper to
 *     type-check and obvious in IDE autocomplete. If a second slot ever
 *     appears (e.g. debug badge, ownership tooltip), add a named field
 *     here -- don't widen to an open bag.
 */

import React, {
  createContext,
  useContext,
  useMemo,
  type FC,
  type ReactNode,
  type PropsWithChildren,
} from 'react';

export type ChartCardSlots = {
  /**
   * Decoration rendered absolutely-positioned over the entire
   * `ChartCard` (header + body + footer). Must be self-positioning
   * (typically `position: absolute; inset: 0; pointer-events: none`).
   * Renders nothing when omitted.
   */
  watermark?: ReactNode;
};

const EMPTY_SLOTS: ChartCardSlots = Object.freeze({});

const ChartCardSlotsContext = createContext<ChartCardSlots>(EMPTY_SLOTS);

export type ChartCardSlotsProviderProps = PropsWithChildren<{
  slots: ChartCardSlots;
}>;

/**
 * Mount once near the app root so every descendant `ChartCard` can pick
 * up decoration slots. Nesting providers is supported and the inner
 * value wins; apps that want to disable a slot in a subtree can pass
 * `slots={{}}`.
 *
 * The provider does not deep-merge -- a nested slots object fully
 * replaces the ancestor one. That keeps the override semantics
 * predictable: "no watermark in this subtree" is unambiguous.
 */
export const ChartCardSlotsProvider: FC<ChartCardSlotsProviderProps> = ({ slots, children }) => {
  // Stabilise the context value on its semantic identity so consumers
  // don't re-render when the caller accidentally passes a fresh object
  // literal every render. Callers who pass module-level constants get
  // this for free; callers who build the object inline get defended
  // against their own mistake. Destructure up front so the memo's
  // dependency array lists a primitive-ish value instead of a property
  // access (keeps `react-hooks/exhaustive-deps` happy on every rule
  // version we've shipped across).
  const { watermark } = slots;
  const value = useMemo<ChartCardSlots>(() => ({ watermark }), [watermark]);
  return <ChartCardSlotsContext.Provider value={value}>{children}</ChartCardSlotsContext.Provider>;
};

/**
 * Read the current slot configuration. Returns a frozen empty object
 * when no provider is mounted so consumers can always destructure
 * without null-checking.
 */
export function useChartCardSlots(): ChartCardSlots {
  return useContext(ChartCardSlotsContext);
}
