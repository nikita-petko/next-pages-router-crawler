import type { FC } from 'react';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMediaQuery } from '@rbx/ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import { NumberContext } from '@modules/charts-generic/charts/numberFormatters';
import {
  ChartUnit,
  ChartUnitAggregationType,
} from '@modules/charts-generic/charts/types/ChartTypes';
import MetricValue, {
  noDataSymbol,
} from '@modules/charts-generic/components/MetricValue/MetricValue';
import type { RAQIV2BreakdownValue } from '@modules/clients/analytics';
import { Item } from '@modules/miscellaneous/common';
import genericRAQIV2TopBreakdownSummaryCardAdapter from '../../../adapters/genericRAQIV2TopBreakdownSummaryCardAdapter';
import { HeroItemCardStyles } from '../../../constants/cardConstants';
import useRAQIV2Request from '../../../hooks/useRAQIV2Request';
import useRAQIV2TranslationDependencies from '../../../hooks/useRAQIV2TranslationDependencies';
import type { ItemMetadata } from '../../../types/RAQIV2SummaryCardShared';
import type { MakeRAQIV2RequestOptions } from '../../../utils/makeRAQIV2Request';
import {
  brandUserSuppliedText,
  getMetricLabelFromMetricLike,
} from '../../../utils/metricLikeSemantics';
import AnalyticsItemCard from '../../AnalyticsItemCard';
import type { GenericRAQIV2SummaryCardProps } from './GenericRAQIV2MetricSummaryCard';

const useItemMetadata = (
  getItemMetadata: (breakdowns: RAQIV2BreakdownValue[]) => Promise<ItemMetadata>,
  breakdowns: RAQIV2BreakdownValue[],
) => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['item-metadata', breakdowns],
    queryFn: () => getItemMetadata(breakdowns),
    select: (result) => ({
      itemId: result.itemId,
      url: result.url,
      itemType: result.itemType,
      name: result.name,
      iconImageAssetId: result.iconImageAssetId,
    }),
    staleTime: 60_000,
  });
  return {
    itemMetadata: data ?? {
      itemId: 0,
      url: undefined,
      itemType: Item.LibraryAsset,
      name: undefined,
      iconImageAssetId: undefined,
    },
    isLoading,
    isError,
    error,
  };
};

export type GenericRAQIV2ItemSummaryCardProps = GenericRAQIV2SummaryCardProps & {
  getItemMetadata: (breakdowns: RAQIV2BreakdownValue[]) => Promise<ItemMetadata>;
};

const GenericRAQIV2ItemSummaryCard: FC<GenericRAQIV2ItemSummaryCardProps> = ({
  spec,
  summaryType,
  label,
  ignoreCache,
  getItemMetadata,
}) => {
  const labelKey = label?.key;
  const translationDependencies = useRAQIV2TranslationDependencies();
  const granularity = spec.granularity;

  const RAQIV2RequestOptions: MakeRAQIV2RequestOptions = useMemo(
    () => ({ fetchTotalSeries: false, fetchComparison: undefined }),
    [],
  );
  const { data: raqiData, ...chartState } = useRAQIV2Request(
    spec,
    RAQIV2RequestOptions,
    ignoreCache,
  );

  const { summary } = useMemo(
    () =>
      genericRAQIV2TopBreakdownSummaryCardAdapter({
        spec,
        responses: raqiData ?? { response: null },
        summaryType,
        granularity,
        translationDependencies,
      }),
    [raqiData, granularity, spec, summaryType, translationDependencies],
  );

  const translatedLabelKey = useMemo(() => {
    return labelKey ? translationDependencies.translate(labelKey) : undefined;
  }, [labelKey, translationDependencies]);
  const metricLabel: FormattedText = useMemo(
    () => translatedLabelKey ?? getMetricLabelFromMetricLike(spec.metric, translationDependencies),
    [spec.metric, translatedLabelKey, translationDependencies],
  );

  const formattedValue = useMemo(
    () => summary?.specificLabel ?? noDataSymbol,
    [summary?.specificLabel],
  );

  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Large'));
  const styleConfig = useMemo(
    () => (isCompactView ? HeroItemCardStyles.small : HeroItemCardStyles.large),
    [isCompactView],
  );

  const breakdowns = summary?.correspondingBreakdowns ?? [];

  const {
    itemMetadata: { itemId, url, itemType, name, iconImageAssetId },
    isLoading: isMetadataLoading,
    isError: isMetadataError,
    error,
  } = useItemMetadata(getItemMetadata, [...breakdowns]);

  // Use name from metadata if available, otherwise fall back to the RAQI breakdown value
  const displayName = name ?? formattedValue;

  return (
    <AnalyticsItemCard
      itemId={itemId}
      itemType={itemType}
      href={url}
      label={metricLabel}
      itemName={brandUserSuppliedText(displayName)}
      iconImageAssetId={iconImageAssetId}
      styleConfig={styleConfig}
      isDataLoading={chartState.isDataLoading || isMetadataLoading}
      isResponseFailed={chartState.isResponseFailed || isMetadataError}
      isUserForbidden={chartState.isUserForbidden}
      error={chartState.error ?? (isMetadataError ? error : null)}
      showNoDataMessage={summary?.value === null}
      value={
        summary?.value !== null && (
          <div>
            <MetricValue
              comparisonChipSpec={summary?.comparisonChipSpec}
              value={summary?.value ?? 0}
              formattingSpec={{
                unit: summary?.unit ?? ChartUnit.Sales,
                type: ChartUnitAggregationType.Sum,
                context: NumberContext.DataPoint,
              }}
              analyticsFormattingSpec={summary?.formattingSpec}
              typographySpec={{
                variant: styleConfig.valueTypographyVariant,
              }}
              showComparisonChipAfterValue
            />
          </div>
        )
      }
    />
  );
};

export default GenericRAQIV2ItemSummaryCard;
