/* istanbul ignore file */
import type {
  ManagedPricingStatus as RawManagedPricingStatus,
  ManagedPricingEvent as RawManagedPricingEvent,
  ManagedPricingEventStatus,
  ManagedPricingEventType,
} from '@rbx/client-price-configuration-api/v1';

// -------------------------------------------------------------------------------------------------
// Tabs
// -------------------------------------------------------------------------------------------------

export const MANAGED_PRICING_TABS = ['overview', 'pricing-activity', 'manage-items'] as const;
export type ManagedPricingTab = (typeof MANAGED_PRICING_TABS)[number];

// -------------------------------------------------------------------------------------------------
// Products
// -------------------------------------------------------------------------------------------------

export type ManagedPricingOnboardingStatus = RawManagedPricingStatus;

export type ManagedProductType = 'DeveloperProduct' | 'GamePass';

export type ManagedPricingStatusFilter = 'enabled' | 'disabled';

export type ManagedProduct = {
  /**
   * Primary ID for the product.
   * For DeveloperProduct, this is the Product ID. For GamePass, this is the game pass ID.
   */
  id: number;
  type: ManagedProductType;
  name: string;
  imageAssetId: number;
  defaultPriceInRobux: number;
  isManagedPricingEnabled: boolean;
  isInActivePriceOptimizationExperiment: boolean;
  updatedTimestamp: Date;
};

export type ManagedProductWithRevenue = ManagedProduct & {
  revenueLast30Days: number;
};

/**
 * Reason a managed product row cannot be selected for bulk actions. Returned by the
 * `ManagedProductsTable` selection predicate and surfaced via `useItemSelection`'s
 * `disabledReason`, so `ManagedProductsTableCheckbox` can map it to specific tooltip copy.
 */
export const ITEM_IN_PRICE_TEST_REASON = 'ItemInPriceTest';

// -------------------------------------------------------------------------------------------------
// Experiments
// -------------------------------------------------------------------------------------------------

export type ExperimentProduct = Omit<
  ManagedProduct,
  'id' | 'defaultPriceInRobux' | 'isInActivePriceOptimizationExperiment' | 'updatedTimestamp'
> & {
  /**
   * Primary ID for the product.
   * For DeveloperProduct, this is the Product ID. For GamePass, this is the game pass ID.
   * Note this is a string as experimentation returns a string here.
   */
  id: string;
  originalPriceInRobux: number;
  optimizedPriceInRobux?: number;
  optimizationPercentage?: number;
};

// -------------------------------------------------------------------------------------------------
// Events
// -------------------------------------------------------------------------------------------------

type BaseManagedPricingEvent = Pick<
  RawManagedPricingEvent,
  'id' | 'eventType' | 'eventReferenceId'
>;

// Upcoming events have no end time, total product count, updated product count, or revenue lift micros
export type UpcomingManagedPricingEvent = BaseManagedPricingEvent & {
  status: Extract<ManagedPricingEventStatus, 'Upcoming'>;
  startTime: RawManagedPricingEvent['startTime'];
  endTime: Extract<RawManagedPricingEvent['endTime'], null>;
  totalProductCount: Extract<RawManagedPricingEvent['totalProductCount'], null>;
  updatedProductCount: Extract<RawManagedPricingEvent['updatedProductCount'], null>;
  revenueLiftMicros: null;
};

// Active events have an end time and total product count, but not updated product count or revenue lift micros
// as these are not available until the event is completed
export type ActiveManagedPricingEvent = BaseManagedPricingEvent & {
  status: Extract<ManagedPricingEventStatus, 'Active'>;
  startTime: NonNullable<RawManagedPricingEvent['startTime']>;
  endTime: NonNullable<RawManagedPricingEvent['endTime']>;
  totalProductCount: NonNullable<RawManagedPricingEvent['totalProductCount']>;
  updatedProductCount: Extract<RawManagedPricingEvent['updatedProductCount'], null>;
  revenueLiftMicros: null;
};

// Completed events have an end time, total product count, updated product count, and revenue lift micros
// as these are available once the event is completed
export type CompletedManagedPricingEvent = BaseManagedPricingEvent & {
  status: Extract<ManagedPricingEventStatus, 'Completed'>;
  startTime: NonNullable<RawManagedPricingEvent['startTime']>;
  endTime: NonNullable<RawManagedPricingEvent['endTime']>;
  totalProductCount: NonNullable<RawManagedPricingEvent['totalProductCount']>;
  updatedProductCount: NonNullable<RawManagedPricingEvent['updatedProductCount']>;
  revenueLiftMicros: NonNullable<RawManagedPricingEvent['revenueLiftMicros']>;
};

// Cancelled events have an end time, but they may not have any other fields populated
export type CancelledManagedPricingEvent = BaseManagedPricingEvent & {
  status: Extract<ManagedPricingEventStatus, 'Cancelled'>;
  startTime: NonNullable<RawManagedPricingEvent['startTime']>;
  endTime: NonNullable<RawManagedPricingEvent['endTime']>;
  totalProductCount: RawManagedPricingEvent['totalProductCount'];
  updatedProductCount: RawManagedPricingEvent['updatedProductCount'];
  revenueLiftMicros: null;
};

// Failed events have an end time, but they may not have any other fields populated
export type FailedManagedPricingEvent = BaseManagedPricingEvent & {
  status: 'Failed'; // TODO: integrate with actual failed status once integrated
  startTime: NonNullable<RawManagedPricingEvent['startTime']>;
  endTime: NonNullable<RawManagedPricingEvent['endTime']>;
  totalProductCount: RawManagedPricingEvent['totalProductCount'];
  updatedProductCount: RawManagedPricingEvent['updatedProductCount'];
  revenueLiftMicros: null;
};

export type ManagedPricingEvent =
  | UpcomingManagedPricingEvent
  | ActiveManagedPricingEvent
  | CompletedManagedPricingEvent
  | CancelledManagedPricingEvent
  | FailedManagedPricingEvent;

export type { ManagedPricingEventStatus, ManagedPricingEventType };
