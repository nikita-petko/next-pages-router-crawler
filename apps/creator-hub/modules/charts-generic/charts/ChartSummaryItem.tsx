import type { FunctionComponent } from 'react';
import React, { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Grid,
  InfoOutlinedIcon,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  RobuxIcon,
  Tooltip,
  Typography,
} from '@rbx/ui';
import type {
  FormattedText,
  TranslationKey,
  TranslationKeyToFormattedText,
} from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import {
  translationKey,
  translationKeyWithoutNamespace,
} from '@modules/analytics-translations/wrapperFunctions';
import type { RAQIV2BreakdownValue } from '@modules/clients/analytics';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useLocale from '../context/useLocale';
import ChartSummaryType from '../enums/ChartSummaryType';
import useChartSummaryStyles from './ChartSummary.styles';
import type { ComparisonChipSpec } from './ComparisonChip';
import ComparisonChip from './ComparisonChip';
import type { TFormattingSpec, TNumberContextMetadata } from './numberFormatters';
import { formatNumberWithSpec, NumberIcon } from './numberFormatters';

export enum SummaryValueType {
  Numeric = 'numeric',
  String = 'string',
}

export const getLabelKeyForSummaryType = (summaryType: ChartSummaryType): TranslationKey | null => {
  switch (summaryType) {
    case ChartSummaryType.Average:
      return translationKey('Label.Average', TranslationNamespace.Analytics);
    case ChartSummaryType.Total:
    case ChartSummaryType.TotalAbsoluteValue:
      return translationKey('Label.TotalSummaryItem', TranslationNamespace.Analytics);
    case ChartSummaryType.QuotaPercentageUsage:
      return translationKey('Label.AverageQuotaUsage', TranslationNamespace.Analytics);
    case ChartSummaryType.LastValue:
      return translationKey('Label.LastValue', TranslationNamespace.Analytics);
    case ChartSummaryType.GrowthRate:
    case ChartSummaryType.SinglePoint:
    case ChartSummaryType.TopBreakdown:
    default:
      return null;
  }
};

type BaseChartSummaryItemSpec = {
  summaryValueType: SummaryValueType;

  summaryType: ChartSummaryType;

  specificLabel?: FormattedText;
  correspondingBreakdowns: readonly RAQIV2BreakdownValue[];
  tooltipKey?: TranslationKey;

  comparisonChipSpec?: ComparisonChipSpec;
  numberContextMetadata?: TNumberContextMetadata;
};

export type NumericChartSummaryItemSpec = BaseChartSummaryItemSpec & {
  summaryValueType: SummaryValueType.Numeric;
  value: number;
  formattingSpec: TFormattingSpec;
  summaryType: Exclude<ChartSummaryType, ChartSummaryType.TopBreakdown>;
};

export type StringChartSummaryItemSpec = BaseChartSummaryItemSpec & {
  summaryValueType: SummaryValueType.String;
  summaryType: ChartSummaryType.TopBreakdown;
  value: FormattedText;

  specificLabel: FormattedText;
};

export type ChartSummaryItemSpec = NumericChartSummaryItemSpec | StringChartSummaryItemSpec;

export const isNumericChartSummaryItemSpec = (
  item: ChartSummaryItemSpec,
): item is NumericChartSummaryItemSpec => {
  return item.summaryValueType === SummaryValueType.Numeric;
};

export const filterNumericChartSummaryItemSpecs = (
  items: ChartSummaryItemSpec[],
): NumericChartSummaryItemSpec[] => {
  return items.filter(isNumericChartSummaryItemSpec);
};

const getLabel = (
  item: ChartSummaryItemSpec,
  translate: TranslationKeyToFormattedText,
): FormattedText | null => {
  const { summaryType, specificLabel } = item;
  const labelKey = getLabelKeyForSummaryType(summaryType);
  return (
    specificLabel ??
    (labelKey ? translate(labelKey) : null) ??
    translate(translationKeyWithoutNamespace('Label.Unknown'))
  );
};

const ChartSummaryItem: FunctionComponent<ChartSummaryItemSpec> = (item) => {
  const { tooltipKey, summaryValueType } = item;
  const { translate } = useTranslationWrapper(useTranslation());
  const locale = useLocale();

  const { formattedValue, label, tooltip } = useMemo(() => {
    switch (summaryValueType) {
      case SummaryValueType.String: {
        const { value: summaryValue, specificLabel: description } = item;
        return {
          formattedValue: summaryValue,
          label: description,
          tooltip: tooltipKey ? translate(tooltipKey) : null,
        };
      }
      case SummaryValueType.Numeric: {
        const { value, formattingSpec } = item;
        return {
          formattedValue: formatNumberWithSpec(value, formattingSpec, { translate, locale }),
          label: getLabel(item, translate),
          tooltip: tooltipKey ? translate(tooltipKey) : null,
        };
      }
      default: {
        const exhaustiveCheck: never = summaryValueType;
        throw new Error(`Unhandled summary value type ${String(exhaustiveCheck)}`);
      }
    }
  }, [item, translate, locale, tooltipKey, summaryValueType]);

  const {
    classes: {
      list,
      listItem,
      listItemIcon,
      tooltipIconPadding,
      summaryFont,
      comparisonChipPadding,
    },
  } = useChartSummaryStyles();

  const comparisonChip = useMemo(() => {
    if (summaryValueType !== SummaryValueType.Numeric) {
      return null;
    }
    const { comparisonChipSpec, numberContextMetadata } = item;

    return comparisonChipSpec ? (
      <div className={comparisonChipPadding}>
        <ComparisonChip {...comparisonChipSpec} numberContextMetadata={numberContextMetadata} />
      </div>
    ) : null;
  }, [comparisonChipPadding, item, summaryValueType]);

  const startingIcon = useMemo(() => {
    if (summaryValueType !== SummaryValueType.Numeric) {
      return null;
    }
    const { formattingSpec } = item;
    return formattingSpec?.icon === NumberIcon.Robux ? (
      <ListItemIcon className={listItemIcon}>
        <RobuxIcon />
      </ListItemIcon>
    ) : null;
  }, [item, summaryValueType, listItemIcon]);

  return (
    <Grid item>
      <List className={list}>
        <ListItem className={listItem}>
          <Grid container item>
            <Typography align='left' variant='body2'>
              {label}
            </Typography>
            {tooltip && (
              <Tooltip title={tooltip} placement='top' enterTouchDelay={0} leaveTouchDelay={3000}>
                <div className={tooltipIconPadding}>
                  <InfoOutlinedIcon fontSize='small' />
                </div>
              </Tooltip>
            )}
          </Grid>
        </ListItem>
        <ListItem className={listItem}>
          {startingIcon}
          <ListItemText>
            <Grid container item alignItems='center'>
              <Typography align='left' variant='h2' className={summaryFont}>
                {formattedValue}
              </Typography>
              {comparisonChip}
            </Grid>
          </ListItemText>
        </ListItem>
      </List>
    </Grid>
  );
};
export default ChartSummaryItem;
