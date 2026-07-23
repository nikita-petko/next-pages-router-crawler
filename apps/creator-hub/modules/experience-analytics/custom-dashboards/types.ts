/**
 * Custom-dashboards authoring DTO types. The `synthesize()` transform converts
 * a `CustomDashboardDocument` into a render-ready
 * `CreatorAnalyticsUntabbedPageConfig` at view time.
 */

import type {
  RAQIV2AggregationType,
  RAQIV2DateRangeType,
  RAQIV2MetricGranularity,
  RAQIV2PercentileType,
  TRAQIV2Dimension,
} from '@rbx/creator-hub-analytics-config';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import type { AnnotationType } from '@modules/clients/analytics/annotations/annotations';
import type { TRAQIV2NumericUIMetric } from '@modules/experience-analytics-shared/constants/AnalyticsMetricDisplayConfig';
import type { TComparisonOffset } from '@modules/experience-analytics-shared/constants/comparisonOffset';
import type { ComputedMetric } from '@modules/experience-analytics-shared/types/ComputedMetric';

// v0.1 alpha: breaking shape changes are not bridged with migration steps —
// pre-launch records are quarantined or dropped. Clearing localStorage
// recovers. Post-launch each breaking change lands as a new step in
// `migrations.ts` and this constant advances by one.
export const CUSTOM_DASHBOARD_CURRENT_SCHEMA_VERSION = 1 as const;

export type CustomDashboardSchemaVersion = typeof CUSTOM_DASHBOARD_CURRENT_SCHEMA_VERSION;

export type CustomDashboardStatus = 'draft' | 'published';

export type TileId = string;

/** Hard caps; service enforces on write, rendering coerces down defensively. */
export const MAX_SUMMARY_CARDS_PER_DASHBOARD = 6;
export const MAX_CHART_TILES_PER_DASHBOARD = 12;
export const MAX_DASHBOARD_NAME_LENGTH = 80;
export const MAX_DASHBOARD_DESCRIPTION_LENGTH = 280;
export const MAX_TILE_TITLE_LENGTH = 80;

/**
 * Per-universe dashboard count cap. Authoritative on the backend once the
 * server-backed service exists; the frontend enforces the same number so the
 * UX rejects creates locally without a roundtrip. When the cap moves, both
 * sides must change together — keep this constant the single source of truth
 * on the client and mirror it server-side. Sized for a long tail well past
 * any realistic creator workflow without making the manage-page list view
 * (eager-loaded, no pagination at M1) sluggish.
 */
export const MAX_DASHBOARDS_PER_UNIVERSE = 100;

/** Length-1 row = full-width; length-2 row = two half-width tiles. */
export const MAX_TILES_PER_ROW = 2 as const;

// TODO(server-backend): evaluate whether these summary-card-only aggregations
// should move into the generated RAQI aggregation enum before the backend-backed
// service ships. Keep them local for now because they are authoring/UI concepts
// that do not currently exist in `RAQIV2AggregationType`.
export const CustomDashboardSummaryCardAggregation = {
  AverageOverTimePeriod: 'AverageOverTimePeriod',
  AveragePerUniqueUser: 'AveragePerUniqueUser',
  MostRecentDataPoint: 'MostRecentDataPoint',
  Total: 'Total',
  Median: 'Median',
  Cumulative: 'Cumulative',
} as const;

export type CustomDashboardSummaryCardAggregation =
  (typeof CustomDashboardSummaryCardAggregation)[keyof typeof CustomDashboardSummaryCardAggregation];

export type SummaryCardAggregation =
  | RAQIV2AggregationType
  | CustomDashboardSummaryCardAggregation
  | RAQIV2PercentileType;

export type ChartAggregation = RAQIV2AggregationType | RAQIV2PercentileType;

export type TimeInterval = 'Cumulative' | 'Day' | 'Week' | 'Hour' | 'HalfHour' | 'Minute';

/**
 * Default chart `dataSpec.granularity`. Required on {@link ChartTileDataSpec};
 * authors should stamp this when no explicit interval is chosen. Backend
 * rejects `DashboardGranularity.Invalid` when the field is omitted on write.
 */
export const DEFAULT_CHART_GRANULARITY = 'Day' as const satisfies TimeInterval;

export const SummaryCardTitleSource = {
  Auto: 'Auto',
  Custom: 'Custom',
} as const;

export type SummaryCardTitleSource =
  (typeof SummaryCardTitleSource)[keyof typeof SummaryCardTitleSource];

/** Persisted chart types on custom-dashboard tiles (subset of render `ChartType`). */
export const CUSTOM_DASHBOARD_CHART_TYPES = [
  ChartType.Spline,
  ChartType.Area,
  ChartType.Bar,
  ChartType.Column,
  ChartType.Pie,
  ChartType.Table,
] as const;

export type CustomDashboardChartType = (typeof CUSTOM_DASHBOARD_CHART_TYPES)[number];

export type CustomDashboardMetricKey = TRAQIV2NumericUIMetric;

export type DashboardMetricVariantSelection = {
  readonly pseudoDimensionKey: string;
  readonly variantKey: string;
};

export type DashboardMetricReference =
  | {
      readonly metricKey: CustomDashboardMetricKey;
      readonly computedMetric?: undefined;
      readonly variantSelections?: ReadonlyArray<DashboardMetricVariantSelection>;
    }
  | {
      readonly metricKey?: undefined;
      readonly computedMetric: ComputedMetric;
      readonly variantSelections?: ReadonlyArray<DashboardMetricVariantSelection>;
    };

/** Per-tile filter; intersected with page-level filters at render. */
export type TileFilter = {
  readonly dimension: string;
  readonly values: ReadonlyArray<string>;
};

type BaseTile = {
  readonly tileId: TileId;
  /** Optional; falls back to the metric display name when unset. */
  readonly title?: string;
};

export type SummaryCardOverlays = {
  readonly periodOverPeriod?: boolean;
};

export type SummaryCardTileConfig = BaseTile & {
  readonly type: 'SummaryCard';
  /** `Auto` means `title` is generated from the selected metric and aggregation. */
  readonly titleSource?: SummaryCardTitleSource;
  readonly metric: DashboardMetricReference;
  readonly aggregation: SummaryCardAggregation;
  readonly overlays?: SummaryCardOverlays;
  readonly filters: ReadonlyArray<TileFilter>;
};

export type ChartOverlays = {
  readonly genreBenchmark?: boolean;
  readonly similarExperienceBenchmark?: boolean;
  /** Only valid for DAU / revenue metrics. */
  readonly topExperienceBenchmark?: boolean;
  readonly previousPeriod?:
    | boolean
    | {
        readonly relativeOffset?: TComparisonOffset;
        readonly customStartTimeMs?: number;
      };
  readonly quota?: boolean;
  readonly trendLine?: boolean;
};

export type ChartTileSmoothing = 'none' | 'weekly';

export type ChartTileMetric = {
  readonly metric: DashboardMetricReference;
  readonly seriesKey: string;
  readonly displayName?: string;
  readonly aggregation?: ChartAggregation;
};

export type ChartTileDataSpec = {
  readonly metrics: ReadonlyArray<ChartTileMetric>;
  readonly aggregation?: ChartAggregation;
  readonly breakdownDimensions?: ReadonlyArray<string>;
  readonly granularity: TimeInterval;
  readonly filters: ReadonlyArray<TileFilter>;
};

export type ChartTileSpec = {
  readonly chartType: CustomDashboardChartType;
  readonly overlays?: ChartOverlays;
  readonly smoothing?: ChartTileSmoothing;
};

export type ChartTileConfig = BaseTile & {
  readonly type: 'Chart';
  readonly dataSpec: ChartTileDataSpec;
  readonly chartSpec: ChartTileSpec;
};

export type CustomDashboardTile = SummaryCardTileConfig | ChartTileConfig;

export type CustomDashboardChartRowColumnCount = 1 | 2;

/**
 * Chart row layout. `columnCount: 2` with one tile is a half-width slot (empty right column).
 */
export type CustomDashboardChartRow = {
  readonly tiles: ReadonlyArray<ChartTileConfig>;
  readonly columnCount: CustomDashboardChartRowColumnCount;
};

export const DashboardPageMode = {
  Untabbed: 'Untabbed',
} as const;

export type DashboardPageMode = (typeof DashboardPageMode)[keyof typeof DashboardPageMode];

export type DashboardAnnotationOptions = {
  readonly supportedAnnotationTypes: ReadonlyArray<AnnotationType>;
  readonly defaultAnnotationTypes: ReadonlyArray<AnnotationType>;
  readonly showAnnotationsControl: boolean;
};

export type DashboardDateRangeDefault =
  | {
      readonly type: 'Relative';
      readonly rangeType: RAQIV2DateRangeType;
    }
  | {
      readonly type: 'Custom';
      readonly startTimeMs: number;
      readonly endTimeMs: number;
    };

export type DashboardTimeRangeOptions =
  | { readonly type: 'None' }
  | {
      readonly type: 'DateRange';
      readonly defaultSelection?: DashboardDateRangeDefault;
    };

export type DashboardSurfaceControls = {
  readonly timeRangeOptions?: DashboardTimeRangeOptions;
  readonly filterDimensions?: ReadonlyArray<TRAQIV2Dimension>;
  readonly defaultFilters?: ReadonlyArray<TileFilter>;
  readonly breakdownDimensions?: ReadonlyArray<TRAQIV2Dimension>;
  readonly defaultBreakdown?: ReadonlyArray<TRAQIV2Dimension>;
  readonly defaultGranularity?: RAQIV2MetricGranularity;
  readonly annotationOptions?: DashboardAnnotationOptions;
};

export type DashboardComponent =
  | { readonly type: 'Chart'; readonly chart: ChartTileConfig }
  | { readonly type: 'SummaryCard'; readonly summaryCard: SummaryCardTileConfig };

export type DashboardGridLayout = {
  readonly type: 'Grid';
  readonly columnCount: 1 | 2;
  readonly children: ReadonlyArray<DashboardLayoutNode>;
};

export type DashboardFlexLayout = {
  readonly type: 'Flex';
  readonly children: ReadonlyArray<DashboardLayoutNode>;
};

export type DashboardStackLayout = {
  readonly type: 'Stack';
  readonly children: ReadonlyArray<DashboardLayoutNode>;
};

export type DashboardLayoutNode =
  | { readonly type: 'Component'; readonly component: DashboardComponent }
  | DashboardGridLayout
  | DashboardFlexLayout
  | DashboardStackLayout;

export type DashboardSurface = {
  readonly controls: DashboardSurfaceControls;
  readonly preControlNodes?: ReadonlyArray<DashboardLayoutNode>;
  readonly bodyNodes: ReadonlyArray<DashboardLayoutNode>;
};

export type DashboardUntabbedPage = {
  readonly mode: typeof DashboardPageMode.Untabbed;
  readonly surface: DashboardSurface;
};

export type DashboardPage = DashboardUntabbedPage;

export type CustomDashboardConfig = {
  readonly page: DashboardPage;
};

/**
 * Hybrid-internal sandbox tag for whether a document/list row is the
 * read-only server original or a browser-local editable copy.
 *
 * Only {@link HybridCustomDashboardService} stamps this. Pure API and pure
 * local services leave it undefined so UI does not confuse "served by the
 * API" with "hybrid server row that must be forked before mutation".
 */
export type CustomDashboardHybridOrigin = 'server' | 'localCopy';

export type CustomDashboardDocument = {
  readonly id: string;
  readonly schemaVersion: CustomDashboardSchemaVersion;
  readonly universeId: number;
  readonly name: string;
  readonly description?: string;
  readonly status: CustomDashboardStatus;
  readonly isPinned: boolean;
  readonly pinnedAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly publishedAt?: string;
  readonly createdByUserId: number;
  readonly createdByUsername: string;
  /**
   * Actor who last mutated the document (the contract's `updated_by`). Set to
   * the creator on create/duplicate and re-stamped by content mutations that
   * carry an actor. Optional during the localStorage M1 transition; older
   * persisted records and actor-less mutations fall back to the creator.
   */
  readonly updatedByUserId?: number;
  readonly updatedByUsername?: string;
  /**
   * Present only in hybrid/internal sandbox mode. `'server'` rows are
   * read-only until forked; `'localCopy'` rows mutate in localStorage.
   */
  readonly hybridOrigin?: CustomDashboardHybridOrigin;
  readonly config: CustomDashboardConfig;
};

/** Loaded-from-storage shape before migrations have been applied. */
export type UnknownPersistedDocument = {
  readonly schemaVersion?: number;
  readonly [key: string]: unknown;
};

/** List-row shape; hybrid origin is inherited from the document when present. */
export type CustomDashboardListItem = CustomDashboardDocument;

export type CustomDashboardListOptions = {
  readonly pageSize?: number;
  readonly pageToken?: string;
};

export type CreateCustomDashboardInput = {
  readonly universeId: number;
  readonly name: string;
  readonly description?: string;
  readonly createdByUserId: number;
  readonly createdByUsername: string;
  readonly config?: CustomDashboardConfig;
};

export type UpdateCustomDashboardInput = {
  readonly name?: string;
  readonly description?: string;
  readonly config?: CustomDashboardConfig;
};

export type AddChartTileInput = {
  readonly tile: ChartTileConfig;
};

export type AddChartTileResult = {
  readonly document: CustomDashboardDocument;
  readonly tile: ChartTileConfig;
};

/** Identifies the user responsible for a mutation (contract's `DashboardActor`). */
export type DashboardActor = {
  readonly userId: number;
  readonly username: string;
};

/** Optional concurrency + attribution controls shared by mutating service calls. */
export type CustomDashboardMutationOptions = {
  /** Opt into optimistic concurrency control; rejects if the stored version advanced. */
  readonly expectedVersion?: number;
  /** Stamps `updatedBy`; when omitted the prior `updatedBy` (or creator) is preserved. */
  readonly actor?: DashboardActor;
};

export type CustomDashboardListResult = {
  readonly items: ReadonlyArray<CustomDashboardListItem>;
  /** Hybrid mode: local-only copies shown in a separate manage-page section. */
  readonly localItems?: ReadonlyArray<CustomDashboardListItem>;
  /** Opaque cursor for the next server page; absent when there is no next page. */
  readonly nextPageToken?: string;
  /**
   * Count of persisted records that could not be materialised (migration
   * failed, JSON corruption, unknown shape). Surfaced once via
   * `SchemaMigrationFailedToast`. Always populated; non-persisting backends
   * report `0`.
   */
  readonly migrationFailedCount: number;
};

export const EMPTY_DASHBOARD_CONFIG: CustomDashboardConfig = {
  page: {
    mode: DashboardPageMode.Untabbed,
    surface: {
      controls: {},
      bodyNodes: [],
    },
  },
};
