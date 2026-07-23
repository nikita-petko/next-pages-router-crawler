import { RAQIV2QueryFilter, TRAQIV2BreakdownDimension } from '@modules/clients/analytics';
import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import type RAQIV2ChartSpec from '../types/RAQIV2ChartSpec';

// NOTE(shumingxu, 02/01/2024): Stolen from https://github.rbx.com/Roblox/creator-dashboard/pull/4595
export type SpecOverride = {
  filter?:
    | {
        override: readonly RAQIV2QueryFilter[];
      }
    | {
        intersect: readonly RAQIV2QueryFilter[];
      };
  breakdown?:
    | {
        override: readonly TRAQIV2BreakdownDimension[];
      }
    | {
        intersect: readonly TRAQIV2BreakdownDimension[];
      };
  granularity?: {
    override: RAQIV2MetricGranularity;
  };
  /** CAUTION(gperkins@20250303): timeRange spec overrides are confusing for users, and should be rare */
  timeSpec?: {
    override: {
      startTime?: Date;
      endTime?: Date;
      snapGranularity?: RAQIV2MetricGranularity;
    };
  };
  limit?: {
    override: number;
  };
  benchmarkPercentiles?: {
    override: [number, number];
  };
};

const computeRAQIV2SpecOverride = <
  TSpec extends Partial<
    Pick<
      RAQIV2ChartSpec,
      'breakdown' | 'filter' | 'granularity' | 'timeSpec' | 'limit' | 'benchmarkPercentiles'
    >
  >,
>(
  spec: TSpec,
  specOverride: Partial<SpecOverride>,
): TSpec => {
  let { filter, breakdown, timeSpec, granularity, limit, benchmarkPercentiles } = spec;

  // special case for filter
  if (specOverride.filter) {
    if ('override' in specOverride.filter) {
      filter = specOverride.filter.override;
    } else {
      filter = [...specOverride.filter.intersect, ...(spec.filter ?? [])];
    }
  }

  // special case for breakdown
  if (specOverride.breakdown) {
    if ('override' in specOverride.breakdown) {
      breakdown = specOverride.breakdown.override;
    } else {
      breakdown = [...specOverride.breakdown.intersect, ...(spec.breakdown ?? [])];
    }
  }

  if (specOverride.granularity) {
    granularity = specOverride.granularity.override;
  }

  // Handle timeSpec only if it exists in specOverride and spec
  if (specOverride.timeSpec) {
    // Only apply timeSpec override if spec has timeSpec to begin with
    if (timeSpec) {
      timeSpec = {
        ...timeSpec,
        ...specOverride.timeSpec.override,
      };
    }
    // If timeSpec exists in specOverride but not in spec, we don't modify it
  }

  if (specOverride.limit) {
    limit = specOverride.limit.override;
  }

  if (specOverride.benchmarkPercentiles) {
    benchmarkPercentiles = specOverride.benchmarkPercentiles.override;
  }

  const chartSpec: TSpec = {
    ...spec,
    ...(filter !== undefined && { filter }),
    ...(breakdown !== undefined && { breakdown }),
    ...(timeSpec !== undefined && { timeSpec }),
    ...(granularity !== undefined && { granularity }),
    ...(limit !== undefined && { limit }),
    ...(benchmarkPercentiles !== undefined && { benchmarkPercentiles }),
  };

  return chartSpec;
};

export default computeRAQIV2SpecOverride;
