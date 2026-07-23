import { Locale, useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { RobuxIcon } from '@rbx/ui';
import { useMemo } from 'react';
import {
  useTranslationWrapper,
  translationKey,
  translationKeyWithoutNamespace,
  TranslationKey,
  TranslationKeyToFormattedText,
} from '@modules/analytics-translations';
import useLocale from '../../context/useLocale';
import { ChartSummaryItemSpec, SummaryValueType } from '../ChartSummaryItem';
import {
  formatNumber,
  NumberContext,
  NumberIcon,
  TNumberContextMetadata,
} from '../numberFormatters';
import { ChartUnit, ChartUnitAggregationType } from '../types/ChartTypes';
import ChartSummaryType from '../../enums/ChartSummaryType';
import formatChartUnit from '../formatChartUnit';

const comparisonChipMaxPercentage = 10; // = 1000%

const getDescriptionKey = (type: ChartUnitAggregationType): TranslationKey | null => {
  switch (type) {
    case ChartUnitAggregationType.Average:
    case ChartUnitAggregationType.AverageRatio:
      return translationKey('Label.Average', TranslationNamespace.Analytics);
    case ChartUnitAggregationType.SummaryTotal:
    case ChartUnitAggregationType.Sum:
      return translationKey('Label.TotalSummaryItem', TranslationNamespace.Analytics);
    case ChartUnitAggregationType.Ratio:
    case ChartUnitAggregationType.Unknown:
      return null;
    case ChartUnitAggregationType.AverageQuotaUsage:
      return translationKey('Label.AverageQuotaUsage', TranslationNamespace.Analytics);
    default: {
      const exhaustiveCheck: never = type;
      throw new Error(`Unhandled summary item type ${exhaustiveCheck}`);
    }
  }
};

const getDescriptionForChartSummaryType = (type: ChartSummaryType): TranslationKey | null => {
  switch (type) {
    case ChartSummaryType.Average:
      return translationKey('Label.Average', TranslationNamespace.Analytics);
    case ChartSummaryType.Total:
    case ChartSummaryType.TotalAbsoluteValue:
      return translationKey('Label.TotalSummaryItem', TranslationNamespace.Analytics);
    case ChartSummaryType.QuotaPercentageUsage:
      return translationKey('Label.AverageQuotaUsage', TranslationNamespace.Analytics);
    case ChartSummaryType.GrowthRate:
    case ChartSummaryType.SinglePoint:
    default:
      return null;
  }
};

const getComparisonChipUnitOverride = (numberContextMetadata?: TNumberContextMetadata) => {
  if (numberContextMetadata?.inRoundedComparisonChipContext) {
    return ChartUnit.WholePercentage;
  }

  return ChartUnit.RoughPercentage;
};

const getSummaryDescription = (
  item: ChartSummaryItemSpec,
  translate: TranslationKeyToFormattedText,
): string => {
  if (item.summaryValueType === SummaryValueType.String) {
    return item.specificLabel;
  }

  const { summaryType, specificLabel, type } = item;
  const descriptionTranslationKey = summaryType
    ? getDescriptionForChartSummaryType(summaryType)
    : getDescriptionKey(type ?? ChartUnitAggregationType.Unknown);

  return (
    specificLabel ||
    (descriptionTranslationKey ? translate(descriptionTranslationKey) : null) ||
    translate(translationKeyWithoutNamespace('Label.Unknown'))
  );
};

const getSummaryValue = (
  item: ChartSummaryItemSpec,
  translate: TranslationKeyToFormattedText,
  locale: Locale,
  summaryValueContext: NumberContext,
): string => {
  if (item.summaryValueType === SummaryValueType.String) {
    return item.value;
  }

  const { value, unit, type, formattingSpec, numberContextMetadata } = item;
  return formatChartUnit(
    value,
    { unit, type, formattingSpec, context: summaryValueContext, numberContextMetadata },
    { locale, translate },
  );
};

const getSummaryStartIcon = (item: ChartSummaryItemSpec) => {
  if (item.summaryValueType === SummaryValueType.String) {
    return undefined;
  }

  const { unit, formattingSpec } = item;
  return unit === ChartUnit.Robux || formattingSpec?.icon === NumberIcon.Robux
    ? RobuxIcon
    : undefined;
};

const getSummaryTooltip = (
  item: ChartSummaryItemSpec,
  translate: TranslationKeyToFormattedText,
): string | undefined => {
  const { tooltipKey } = item;
  return tooltipKey ? translate(tooltipKey) : undefined;
};

const getSummaryComparisonChip = (
  item: ChartSummaryItemSpec,
  translate: TranslationKeyToFormattedText,
  locale: Locale,
) => {
  if (item.summaryValueType !== SummaryValueType.Numeric) return undefined;
  const { comparisonChipSpec } = item;

  if (!comparisonChipSpec) return undefined;

  const { isGood, isUp, percentage, tooltip, numberContextMetadata } = comparisonChipSpec;

  const isOverflow = Math.abs(percentage) > comparisonChipMaxPercentage;
  const numberToShow = isOverflow ? comparisonChipMaxPercentage : percentage;
  const prefixIfOverflow = numberToShow > 0 ? '>' : '<';
  const prefix = isOverflow ? prefixIfOverflow : '';

  return {
    isGood,
    isUp,
    tooltip,
    // eslint-disable-next-line deprecation/deprecation -- migration in progress. Will be migrated in DSA-4660.
    formattedLabel: `${prefix}${formatNumber({
      value: numberToShow,
      unit: getComparisonChipUnitOverride(numberContextMetadata),
      type: ChartUnitAggregationType.Ratio,
      context: NumberContext.DataPoint,
      locale,
      translate,
      numberContextMetadata,
    })}`,
  };
};

export const getSummarySpec = ({
  item,
  locale,
  translate,
  summaryValueContext,
}: {
  item: ChartSummaryItemSpec;
  locale: Locale;
  translate: TranslationKeyToFormattedText;
  summaryValueContext: NumberContext;
}) => {
  const key =
    item.summaryValueType === SummaryValueType.String
      ? `string.${item.specificLabel}.${item.value}`
      : `${item.type}.${item.specificLabel}.${item.unit}.${item.value}`;

  return {
    key,
    summaryValue: getSummaryValue(item, translate, locale, summaryValueContext),
    description: getSummaryDescription(item, translate),
    StartSummaryIcon: getSummaryStartIcon(item),
    comparisonChipSpec: getSummaryComparisonChip(item, translate, locale),
    tooltip: getSummaryTooltip(item, translate),
  };
};

/**
 * Hook to produce webblox chart acceptable summary specs
 */
const useChartSummarySpecs = (summaryItems: ChartSummaryItemSpec[]) => {
  const locale = useLocale();
  const { translate } = useTranslationWrapper(useTranslation());

  return useMemo(
    () =>
      summaryItems.map((item) =>
        getSummarySpec({
          item,
          locale,
          translate,
          summaryValueContext: NumberContext.ChartSummary,
        }),
      ),
    [locale, summaryItems, translate],
  );
};

export default useChartSummarySpecs;
