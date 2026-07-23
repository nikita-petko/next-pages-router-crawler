import React, { useMemo } from 'react';
import {
  ChartUnit,
  ChartUnitAggregationType,
  ComparisonChipSpec,
  FormattingSpec,
  GenericChartState,
  MetricValue,
  NumberContext,
} from '@modules/charts-generic';
import { FormattedText, TranslationKey, translationKey } from '@modules/analytics-translations';
import { Item, urls } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import AnalyticsItemCard from './AnalyticsItemCard';
import useAnalyticsItemCardStyles from './AnalyticsItemCard.styles';
import { THeroItemCardStyleConfig } from '../constants/cardConstants';
import useRAQIV2TranslationDependencies from '../hooks/useRAQIV2TranslationDependencies';

export enum AnalyticsHeroItemCategory {
  TopSelling = 'TopSelling',
  TopGrossing = 'TopGrossing',
}

const ItemLabelTranslationKeys: Record<AnalyticsHeroItemCategory, TranslationKey> = {
  [AnalyticsHeroItemCategory.TopSelling]: translationKey(
    'Label.TopSellingItem',
    TranslationNamespace.AvatarAnalytics,
  ),
  [AnalyticsHeroItemCategory.TopGrossing]: translationKey(
    'Label.TopGrossingItem',
    TranslationNamespace.AvatarAnalytics,
  ),
};

const ItemValueFormatConfig: Record<AnalyticsHeroItemCategory, FormattingSpec> = {
  [AnalyticsHeroItemCategory.TopSelling]: {
    unit: ChartUnit.Sales,
    type: ChartUnitAggregationType.Sum,
    context: NumberContext.DataPoint,
  },
  [AnalyticsHeroItemCategory.TopGrossing]: {
    unit: ChartUnit.Robux,
    type: ChartUnitAggregationType.Sum,
    context: NumberContext.DataPoint,
  },
};

export type AnalyticsHeroItemCardSpec = {
  targetId: number;
  itemType: Item;
  itemName: string;
  value: number | null;
  topCategory: AnalyticsHeroItemCategory;
  styleConfig: THeroItemCardStyleConfig;
  comparisonChipSpec?: ComparisonChipSpec;
  href?: string;
} & GenericChartState;

// See analytics/molecules/AvatarItemCard for storybook example
const AnalyticsHeroItemCard = ({
  targetId,
  itemType,
  itemName,
  value,
  topCategory,
  styleConfig,
  comparisonChipSpec,
  href,
  ...chartState
}: AnalyticsHeroItemCardSpec) => {
  const { translate } = useRAQIV2TranslationDependencies();

  const hrefOrDefault = useMemo(
    () => href ?? urls.getUrlForItemType(itemType, targetId),
    [href, itemType, targetId],
  );

  const {
    classes: { valueContainer },
  } = useAnalyticsItemCardStyles(styleConfig);

  return (
    <AnalyticsItemCard
      itemId={targetId}
      itemType={itemType}
      href={hrefOrDefault ?? undefined}
      label={translate(ItemLabelTranslationKeys[topCategory])}
      itemName={itemName as FormattedText}
      styleConfig={styleConfig}
      {...chartState}
      showNoDataMessage={value === null}
      value={
        value !== null && (
          <div className={valueContainer}>
            <MetricValue
              value={value}
              formattingSpec={ItemValueFormatConfig[topCategory]}
              comparisonChipSpec={comparisonChipSpec}
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

export default AnalyticsHeroItemCard;
