import {
  ChartUnit,
  ChartUnitAggregationType,
} from '@modules/charts-generic/charts/types/ChartTypes';

const chartUnitToAverageSummaryAggregationType: Record<ChartUnit, ChartUnitAggregationType> = {
  [ChartUnit.Unknown]: ChartUnitAggregationType.Average,

  [ChartUnit.Percentage]: ChartUnitAggregationType.AverageRatio,
  [ChartUnit.LegacyPercentage]: ChartUnitAggregationType.AverageRatio,
  [ChartUnit.RoughPercentage]: ChartUnitAggregationType.AverageRatio,
  [ChartUnit.WholePercentage]: ChartUnitAggregationType.AverageRatio,
  [ChartUnit.FramesPerSecond]: ChartUnitAggregationType.AverageRatio,

  [ChartUnit.Robux]: ChartUnitAggregationType.Average,
  [ChartUnit.Players]: ChartUnitAggregationType.Average,
  [ChartUnit.Sessions]: ChartUnitAggregationType.Average,
  [ChartUnit.Days]: ChartUnitAggregationType.Average,
  [ChartUnit.Hours]: ChartUnitAggregationType.Average,
  [ChartUnit.Minutes]: ChartUnitAggregationType.Average,
  [ChartUnit.Seconds]: ChartUnitAggregationType.Average,
  [ChartUnit.Milliseconds]: ChartUnitAggregationType.Average,
  [ChartUnit.Impressions]: ChartUnitAggregationType.Average,
  [ChartUnit.Teleports]: ChartUnitAggregationType.Average,
  [ChartUnit.VideoViews]: ChartUnitAggregationType.Average,
  [ChartUnit.RequestUnits]: ChartUnitAggregationType.Average,
  [ChartUnit.Requests]: ChartUnitAggregationType.Average,
  [ChartUnit.Bytes]: ChartUnitAggregationType.Average,
  [ChartUnit.KiloBytes]: ChartUnitAggregationType.Average,
  [ChartUnit.MegaBytes]: ChartUnitAggregationType.Average,
  [ChartUnit.Gigabytes]: ChartUnitAggregationType.Average,
  [ChartUnit.Results]: ChartUnitAggregationType.Average,
  [ChartUnit.Score]: ChartUnitAggregationType.Average,
  [ChartUnit.Sales]: ChartUnitAggregationType.Average,
  [ChartUnit.Cancellations]: ChartUnitAggregationType.Average,
  [ChartUnit.Items]: ChartUnitAggregationType.Average,
  [ChartUnit.Currency]: ChartUnitAggregationType.Average,
  [ChartUnit.Cores]: ChartUnitAggregationType.Average,
  [ChartUnit.InExperienceCurrency]: ChartUnitAggregationType.Average,
};

export default chartUnitToAverageSummaryAggregationType;
