import React, { FC, useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { ChartColor, OrderedChartColors } from '@rbx/analytics-ui';

/**
 * Assigns consistent colors to breakdown values across multiple charts on the same page.
 *
 * Colors are partitioned by "dimension set" — the sorted set of breakdown dimensions
 * a chart is using. Two charts both breaking down on Gender will share the same color
 * for "Male", but a chart breaking down on Gender+AgeRange forms a separate dimension
 * set and may reuse colors freely.
 *
 * Assignment is stable: once a breakdown value receives a color, it keeps it for the
 * lifetime of the provider. When the palette is exhausted, indices wrap around
 * (matching the default Highcharts behavior).
 *
 * Index 0 (Blue) is used by Highcharts for the total/aggregate series, so breakdown
 * assignment starts at index 1 and rotates through the full palette. Blue still
 * appears once per cycle, but late enough that it won't be adjacent to the total.
 *
 * When more values exist than palette colors, a debounced rebalance pass uses
 * adjacency information (which series appear next to each other across charts)
 * to swap colors and minimize visual conflicts between adjacent same-colored series.
 */

const REBALANCE_DEBOUNCE_MS = 100;
const MAX_REBALANCE_ITERATIONS = 10;

// Pipe-separated sorted "dimension:value" pairs, e.g. "AgeRange:13-15|Gender:Male"
export type BreakdownValueKey = string & { __brand: 'BreakdownValueKey' };
// Pipe-separated sorted dimension names, e.g. "AgeRange|Gender"
export type DimensionSetKey = string & { __brand: 'DimensionSetKey' };

// 0-indexed color palette index, e.g. 0 for Blue, 1 for Red, etc.
type ColorIndex = number & { __brand: 'ColorIndex' };
// Integer adjacency weight, e.g. 1 for adjacent series, 2 for two series apart, etc.
type AdjacencyWeight = number & { __brand: 'AdjacencyWeight' };

/**
 * Computes a stable key for a set of breakdown dimensions.
 * Dimensions are sorted so that the same set always produces the same key,
 * regardless of the order they were specified.
 */
export const getDimensionSetKey = (
  dimensions: readonly string[] | undefined,
): DimensionSetKey | null => {
  if (!dimensions?.length) return null;
  return [...dimensions].sort().join('|') as DimensionSetKey;
};

/**
 * Computes a stable key for a set of breakdown values within a series.
 * Sorted by dimension to ensure consistent key generation regardless of
 * the order breakdown values appear in the API response.
 */
export const getBreakdownValueKey = (
  breakdownValues: { dimension?: string; value?: string }[],
): BreakdownValueKey | null => {
  if (breakdownValues.length === 0) return null;
  return breakdownValues
    .map((bv) => `${bv.dimension ?? ''}:${bv.value ?? ''}`)
    .sort()
    .join('|') as BreakdownValueKey;
};

class BreakdownColorStore {
  private colorMaps = new Map<DimensionSetKey, Map<BreakdownValueKey, ColorIndex>>();

  /**
   * Tracks how often two breakdown values appear adjacent in series ordering
   * across all charts. Used by the rebalance algorithm to detect and resolve
   * color conflicts between neighboring series.
   */
  private adjacencyMaps = new Map<
    DimensionSetKey,
    Map<BreakdownValueKey, Map<BreakdownValueKey, AdjacencyWeight>>
  >();

  /**
   * dimensionSetKey → colorMap.size at the time of the last rebalance
   *
   * Prevents re-running rebalance until new breakdown values have been added.
   */
  private rebalancedAtSizes = new Map<DimensionSetKey, number>();

  getOrAssignColorIndex(
    dimensionSetKey: DimensionSetKey,
    breakdownValueKey: BreakdownValueKey,
  ): ColorIndex {
    let map = this.colorMaps.get(dimensionSetKey);
    if (!map) {
      map = new Map();
      this.colorMaps.set(dimensionSetKey, map);
    }

    const existing = map.get(breakdownValueKey);
    if (existing !== undefined) {
      return existing;
    }

    const colorIndex = ((map.size + 1) % OrderedChartColors.length) as ColorIndex;
    map.set(breakdownValueKey, colorIndex);
    return colorIndex;
  }

  /**
   * Records that the given breakdown values appeared in this order within a single
   * chart's series list. Adjacent pairs get their co-occurrence weight incremented.
   *
   * @param orderedValueKeys breakdownValueKeys in rendering order; nulls (e.g. total series) are filtered out
   */
  recordAdjacency(
    dimensionSetKey: DimensionSetKey,
    orderedValueKeys: (BreakdownValueKey | null)[],
  ): void {
    const validKeys = orderedValueKeys.filter((k): k is BreakdownValueKey => k !== null);
    if (validKeys.length < 2) return;

    let adjMap = this.adjacencyMaps.get(dimensionSetKey);
    if (!adjMap) {
      adjMap = new Map();
      this.adjacencyMaps.set(dimensionSetKey, adjMap);
    }

    validKeys.forEach((a, i) => {
      if (i >= validKeys.length - 1) return;
      const b = validKeys[i + 1];
      if (a !== b) {
        BreakdownColorStore.incrementAdjacency(adjMap!, a, b);
        BreakdownColorStore.incrementAdjacency(adjMap!, b, a);
      }
    });
  }

  /**
   * Returns true when a dimension set has wrapped (more values than palette colors),
   * hasn't been rebalanced since new values were added, and has actual adjacency
   * conflicts (adjacent series sharing a color).
   */
  needsRebalance(dimensionSetKey: DimensionSetKey): boolean {
    const map = this.colorMaps.get(dimensionSetKey);
    if (!map || map.size <= OrderedChartColors.length) return false;

    const lastRebalancedAt = this.rebalancedAtSizes.get(dimensionSetKey) ?? 0;
    if (lastRebalancedAt >= map.size) return false;

    return this.computeConflictScore(dimensionSetKey) > 0;
  }

  /**
   * Greedy local search: for each value with adjacency conflicts, try every
   * palette color and pick the one that minimizes that value's conflict weight.
   * Repeat until no single-value change improves the score, or we hit the
   * iteration cap. Total conflict score strictly decreases each iteration,
   * so this always converges.
   *
   * Returns true if any color assignments changed.
   */
  rebalance(dimensionSetKey: DimensionSetKey): boolean {
    const colorMap = this.colorMaps.get(dimensionSetKey);
    const adjMap = this.adjacencyMaps.get(dimensionSetKey);
    if (!colorMap || !adjMap) return false;

    this.rebalancedAtSizes.set(dimensionSetKey, colorMap.size);

    let changed = false;

    for (let iter = 0; iter < MAX_REBALANCE_ITERATIONS; iter += 1) {
      const iterChanged = BreakdownColorStore.runRebalanceIteration(colorMap, adjMap);
      if (iterChanged) {
        changed = true;
      }
      if (!iterChanged) break;
    }

    return changed;
  }

  private static runRebalanceIteration(
    colorMap: Map<BreakdownValueKey, ColorIndex>,
    adjMap: Map<BreakdownValueKey, Map<BreakdownValueKey, AdjacencyWeight>>,
  ): boolean {
    let changed = false;

    [...colorMap.keys()].forEach((valueKey) => {
      const neighbors = adjMap.get(valueKey);
      if (!neighbors) return;

      const currentColor = colorMap.get(valueKey)!;

      let currentConflictWeight = 0;
      neighbors.forEach((weight, neighborKey) => {
        if (colorMap.get(neighborKey) === currentColor) {
          currentConflictWeight += weight;
        }
      });

      if (currentConflictWeight === 0) return;

      const best = BreakdownColorStore.findBestColor(
        currentColor,
        currentConflictWeight,
        neighbors,
        colorMap,
      );

      if (best.color !== currentColor) {
        colorMap.set(valueKey, best.color);
        changed = true;
      }
    });

    return changed;
  }

  private static findBestColor(
    currentColor: ColorIndex,
    currentWeight: number,
    neighbors: Map<BreakdownValueKey, AdjacencyWeight>,
    colorMap: Map<BreakdownValueKey, ColorIndex>,
  ): { color: ColorIndex; weight: number } {
    let bestColor: number = currentColor;
    let bestWeight = currentWeight;

    for (let c = 0; c < OrderedChartColors.length; c += 1) {
      if (c === currentColor) {
        // eslint-disable-next-line no-continue -- skip the color we already have
        continue;
      }

      let candidateWeight = 0;
      neighbors.forEach((weight, neighborKey) => {
        if (colorMap.get(neighborKey) === c) {
          candidateWeight += weight;
        }
      });

      if (candidateWeight < bestWeight) {
        bestColor = c;
        bestWeight = candidateWeight;
      }
    }

    return { color: bestColor as ColorIndex, weight: bestWeight };
  }

  getDimensionSetKeys(): DimensionSetKey[] {
    return [...this.colorMaps.keys()];
  }

  private computeConflictScore(dimensionSetKey: DimensionSetKey): number {
    const colorMap = this.colorMaps.get(dimensionSetKey);
    const adjMap = this.adjacencyMaps.get(dimensionSetKey);
    if (!colorMap || !adjMap) return 0;

    let score = 0;
    const counted = new Set<string>();

    adjMap.forEach((neighbors, valueKey) => {
      neighbors.forEach((weight, neighborKey) => {
        const edgeKey =
          valueKey < neighborKey ? `${valueKey}\0${neighborKey}` : `${neighborKey}\0${valueKey}`;
        if (counted.has(edgeKey)) return;
        counted.add(edgeKey);

        if (colorMap.get(valueKey) === colorMap.get(neighborKey)) {
          score += weight;
        }
      });
    });

    return score;
  }

  private static incrementAdjacency(
    adjMap: Map<BreakdownValueKey, Map<BreakdownValueKey, AdjacencyWeight>>,
    from: BreakdownValueKey,
    to: BreakdownValueKey,
  ): void {
    let neighbors = adjMap.get(from);
    if (!neighbors) {
      neighbors = new Map();
      adjMap.set(from, neighbors);
    }
    neighbors.set(to, ((neighbors.get(to) ?? 0) + 1) as AdjacencyWeight);
  }
}

type BreakdownColorConsistencyContextValue = {
  getOrAssignColor: (
    dimensionSetKey: DimensionSetKey,
    breakdownValueKey: BreakdownValueKey,
  ) => ChartColor | undefined;
  recordSeriesOrder: (
    dimensionSetKey: DimensionSetKey,
    orderedValueKeys: (BreakdownValueKey | null)[],
  ) => void;
};

const noop = () => {};

const defaultContextValue: BreakdownColorConsistencyContextValue = {
  getOrAssignColor: () => undefined,
  recordSeriesOrder: noop,
};

export const BreakdownColorConsistencyContext =
  React.createContext<BreakdownColorConsistencyContextValue>(defaultContextValue);

export const BreakdownColorConsistencyProvider: FC<React.PropsWithChildren> = ({ children }) => {
  const storeRef = useRef(new BreakdownColorStore());
  const [generation, setGeneration] = useState(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleRebalance = useCallback(() => {
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      const store = storeRef.current;
      let anyChanged = false;
      store.getDimensionSetKeys().forEach((dimSetKey) => {
        if (store.needsRebalance(dimSetKey)) {
          if (store.rebalance(dimSetKey)) {
            anyChanged = true;
          }
        }
      });
      if (anyChanged) {
        setGeneration((g) => g + 1);
      }
    }, REBALANCE_DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const recordSeriesOrder = useCallback(
    (dimensionSetKey: DimensionSetKey, orderedValueKeys: (BreakdownValueKey | null)[]) => {
      storeRef.current.recordAdjacency(dimensionSetKey, orderedValueKeys);
      if (storeRef.current.needsRebalance(dimensionSetKey)) {
        scheduleRebalance();
      }
    },
    [scheduleRebalance],
  );

  const contextValue = useMemo<BreakdownColorConsistencyContextValue>(
    () => ({
      getOrAssignColor: (
        dimensionSetKey: DimensionSetKey,
        breakdownValueKey: BreakdownValueKey,
      ) => {
        const index = storeRef.current.getOrAssignColorIndex(dimensionSetKey, breakdownValueKey);
        return OrderedChartColors[index];
      },
      recordSeriesOrder,
    }),
    // generation nonce forces new getOrAssignColor reference so consumers re-derive colors after rebalance
    // eslint-disable-next-line react-hooks/exhaustive-deps -- generation nonce
    [generation, recordSeriesOrder],
  );

  return (
    <BreakdownColorConsistencyContext.Provider value={contextValue}>
      {children}
    </BreakdownColorConsistencyContext.Provider>
  );
};

export { BreakdownColorStore };
