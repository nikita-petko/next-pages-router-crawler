import { useMemo } from 'react';
import type { Locale } from '@rbx/intl';
import { useTranslation } from '@rbx/intl';
import { RobuxIcon } from '@rbx/ui';
import type { TranslationKeyToFormattedText } from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKeyWithoutNamespace } from '@modules/analytics-translations/wrapperFunctions';
import {
  roughPercentageFormattingSpec,
  wholePercentageFormattingSpec,
} from '../../constants/analyticsNumberFormattingSpec';
import useLocale from '../../context/useLocale';
import type { ChartSummaryItemSpec } from '../ChartSummaryItem';
import { SummaryValueType, getLabelKeyForSummaryType } from '../ChartSummaryItem';
import type { NumberContext, TNumberContextMetadata } from '../numberFormatters';
import { formatNumberWithSpec, NumberIcon } from '../numberFormatters';

const comparisonChipMaxPercentage = 10; // = 1000%

const getComparisonChipFormattingSpec = (numberContextMetadata?: TNumberContextMetadata) => {
  if (numberContextMetadata?.inRoundedComparisonChipContext) {
    return wholePercentageFormattingSpec;
  }
  return roughPercentageFormattingSpec;
};

const getSummaryDescription = (
  item: ChartSummaryItemSpec,
  translate: TranslationKeyToFormattedText,
): string => {
  if (item.summaryValueType === SummaryValueType.String) {
    return item.specificLabel;
  }

  const { summaryType, specificLabel } = item;
  const descriptionTranslationKey = getLabelKeyForSummaryType(summaryType);

  return (
    specificLabel ??
    (descriptionTranslationKey ? translate(descriptionTranslationKey) : null) ??
    translate(translationKeyWithoutNamespace('Label.Unknown'))
  );
};

const getSummaryValue = (
  item: ChartSummaryItemSpec,
  translate: TranslationKeyToFormattedText,
  locale: Locale,
): string => {
  if (item.summaryValueType === SummaryValueType.String) {
    return item.value;
  }

  const { value, formattingSpec } = item;
  return formatNumberWithSpec(value, formattingSpec, { locale, translate });
};

const getSummaryStartIcon = (item: ChartSummaryItemSpec) => {
  if (item.summaryValueType === SummaryValueType.String) {
    return undefined;
  }

  const { formattingSpec } = item;
  return formattingSpec?.icon === NumberIcon.Robux ? RobuxIcon : undefined;
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
  if (item.summaryValueType !== SummaryValueType.Numeric) {
    return undefined;
  }
  const { comparisonChipSpec } = item;

  if (!comparisonChipSpec) {
    return undefined;
  }

  const { isGood, isUp, percentage, tooltip, numberContextMetadata } = comparisonChipSpec;

  const isOverflow = Math.abs(percentage) > comparisonChipMaxPercentage;
  const numberToShow = isOverflow ? comparisonChipMaxPercentage : percentage;
  const prefixIfOverflow = numberToShow > 0 ? '>' : '<';
  const prefix = isOverflow ? prefixIfOverflow : '';

  const chipFormattingSpec = getComparisonChipFormattingSpec(numberContextMetadata);

  return {
    isGood,
    isUp,
    tooltip,
    formattedLabel: `${prefix}${formatNumberWithSpec(numberToShow, chipFormattingSpec, {
      locale,
      translate,
    })}`,
  };
};

export const getSummarySpec = ({
  item,
  locale,
  translate,
}: {
  item: ChartSummaryItemSpec;
  locale: Locale;
  translate: TranslationKeyToFormattedText;
  summaryValueContext?: NumberContext;
}) => {
  const key =
    item.summaryValueType === SummaryValueType.String
      ? `string.${item.specificLabel}.${item.value}`
      : `${item.summaryType}.${item.specificLabel}.${item.value}`;

  return {
    key,
    summaryValue: getSummaryValue(item, translate, locale),
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
        }),
      ),
    [locale, summaryItems, translate],
  );
};

export default useChartSummarySpecs;
