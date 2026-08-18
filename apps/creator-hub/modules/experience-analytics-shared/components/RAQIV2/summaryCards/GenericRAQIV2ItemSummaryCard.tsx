import type { FC } from 'react';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMediaQuery } from '@rbx/ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import { NumberContext } from '@modules/charts-generic/charts/numberFormatters';
import MetricValue, {
  noDataSymbol,
} from '@modules/charts-generic/components/MetricValue/MetricValue';
import { DailyTimeSeriesAlignedToUTCMidnight } from '@modules/charts-generic/enums/SeriesIntervalMeaning';
import type { RAQIV2BreakdownValue } from '@modules/clients/analytics';
import { Item } from '@modules/miscellaneous/common';
import genericRAQIV2TopBreakdownSummaryCardAdapter from '../../../adapters/genericRAQIV2TopBreakdownSummaryCardAdapter';
import { HeroItemCardStyles } from '../../../constants/cardConstants';
import raqiV2MetricGranularityToSeriesIntervalMeaning from '../../../constants/RAQIV2MetricGranularityToSeriesIntervalMeaning';
import useRAQIV2Request from '../../../hooks/useRAQIV2Request';
import useRAQIV2TranslationDependencies from '../../../hooks/useRAQIV2TranslationDependencies';
import { generateAnalyticsNumberFormattingSpec } from '../../../utils/analyticsNumberFormattingSpec';
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

export type ItemMetadata = {
  itemId: number;
  url?: string;
  itemType: Item;
  name?: string;

  // Some product types (e.g. Developer Products) may need to have their image thumbnails
  // retrieved from the thumbnail asset id directly instead of the item id.
  // (for developer products this is because of the target ID -> product ID migration)
  // The optional iconImageAssetId should be used to populate the thumbnail image if it exists,
  // and fallback to the item id if not.
  iconImageAssetId?: number;
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
  const translationDependencies = useRAQIV2TranslationDependencies();
  const seriesIntervalMeaning = spec.granularity
    ? raqiV2MetricGranularityToSeriesIntervalMeaning(spec.granularity)
    : DailyTimeSeriesAlignedToUTCMidnight;

  const RAQIV2RequestOptions: MakeRAQIV2RequestOptions = useMemo(
    () => ({ fetchTotalSeries: false, fetchComparison: undefined }),
    [],
  );
  const requestResult = useRAQIV2Request(spec, RAQIV2RequestOptions, ignoreCache);
  const { data: raqiData } = requestResult;

  const { summary } = useMemo(
    () =>
      genericRAQIV2TopBreakdownSummaryCardAdapter({
        spec,
        responses: raqiData ?? { response: null },
        summaryType,
        granularity: seriesIntervalMeaning,
        translationDependencies,
      }),
    [raqiData, seriesIntervalMeaning, spec, summaryType, translationDependencies],
  );

  const translatedLabelKey = useMemo(() => {
    const labelKey = label?.key;
    return labelKey ? translationDependencies.translate(labelKey) : undefined;
  }, [label?.key, translationDependencies]);
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
  const displayName = name ? brandUserSuppliedText(name) : formattedValue;
  const analyticsFormattingSpec = useMemo(
    () =>
      generateAnalyticsNumberFormattingSpec({
        metric: spec.metric,
        context: NumberContext.DataPoint,
      }),
    [spec.metric],
  );

  return (
    <AnalyticsItemCard
      itemId={itemId}
      itemType={itemType}
      href={url}
      label={metricLabel}
      itemName={displayName}
      iconImageAssetId={iconImageAssetId}
      styleConfig={styleConfig}
      isDataLoading={requestResult.isDataLoading || isMetadataLoading}
      isResponseFailed={requestResult.isResponseFailed || isMetadataError}
      isUserForbidden={requestResult.isUserForbidden}
      error={requestResult.error ?? (isMetadataError ? error : null)}
      showNoDataMessage={summary?.value === null}
      value={
        summary?.value !== null && (
          <div>
            <MetricValue
              comparisonChipSpec={summary?.comparisonChipSpec}
              value={summary?.value ?? 0}
              analyticsFormattingSpec={summary?.formattingSpec ?? analyticsFormattingSpec}
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
