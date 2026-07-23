import type { FunctionComponent } from 'react';
import { useMemo } from 'react';
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
import type ChartSummaryType from '../enums/ChartSummaryType';
import useChartSummaryStyles from './ChartSummary.styles';
import type { ComparisonChipSpec } from './ComparisonChip';
import ComparisonChip from './ComparisonChip';
import type { TFormattingSpec, TNumberContextMetadata } from './numberFormatters';
import { formatNumber, formatNumberWithSpec, NumberContext, NumberIcon } from './numberFormatters';
import { ChartUnit, ChartUnitAggregationType } from './types/ChartTypes';

export enum SummaryValueType {
  Numeric = 'numeric',
  String = 'string',
}

type BaseChartSummaryItemSpec = {
  summaryValueType: SummaryValueType;

  // Label shown above
  // @deprecated Use formattingSpec instead. Will be removed in DSA-4660.
  unit?: ChartUnit;
  // @deprecated Use formattingSpec instead. Will be removed in DSA-4660.
  type?: ChartUnitAggregationType;

  formattingSpec?: TFormattingSpec;
  summaryType?: ChartSummaryType;

  specificLabel?: FormattedText; // required if not 'average' or 'total'
  correspondingBreakdowns: readonly RAQIV2BreakdownValue[];
  tooltipKey?: TranslationKey;

  comparisonChipSpec?: ComparisonChipSpec;
  numberContextMetadata?: TNumberContextMetadata;
};

export type NumericChartSummaryItemSpec = BaseChartSummaryItemSpec & {
  summaryValueType: SummaryValueType.Numeric;
  value: number;
  summaryType?: Exclude<ChartSummaryType, ChartSummaryType.TopBreakdown>;
};

export type StringChartSummaryItemSpec = BaseChartSummaryItemSpec & {
  summaryValueType: SummaryValueType.String;
  summaryType: ChartSummaryType.TopBreakdown;
  value: FormattedText;

  // Used for the description
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

const getLabelKey = (type: ChartUnitAggregationType): TranslationKey | null => {
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
    case ChartUnitAggregationType.LastValue:
      return translationKey('Label.LastValue', TranslationNamespace.Analytics);
    default: {
      const exhaustiveCheck: never = type;
      throw new Error(`Unhandled summary item type ${exhaustiveCheck as string}`);
    }
  }
};

const getLabel = (
  item: ChartSummaryItemSpec,
  translate: TranslationKeyToFormattedText,
): FormattedText | null => {
  const { type, specificLabel } = item;
  const labelKey = getLabelKey(type ?? ChartUnitAggregationType.Unknown);
  return (
    specificLabel ||
    (labelKey ? translate(labelKey) : null) ||
    translate(translationKeyWithoutNamespace('Label.Unknown'))
  );
};
const ChartSummaryItem: FunctionComponent<ChartSummaryItemSpec> = (item) => {
  const { tooltipKey, summaryValueType } = item;
  const { translate } = useTranslationWrapper(useTranslation());
  const locale = useLocale();
  const isInLuobuEnvironment = useMemo(() => process.env.buildTarget === 'luobu', []);

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
        const { value, unit, type, formattingSpec, numberContextMetadata } = item;
        if (formattingSpec) {
          return {
            formattedValue: formatNumberWithSpec(value, formattingSpec, { translate, locale }),
            label: getLabel(item, translate),
            tooltip: tooltipKey ? translate(tooltipKey) : null,
          };
        }
        return {
          // oxlint-disable-next-line @typescript-eslint/no-deprecated -- migration in progress. Will be removed in DSA-4660.
          formattedValue: formatNumber({
            value,
            unit: unit ?? ChartUnit.Unknown,
            type: type ?? ChartUnitAggregationType.Unknown,
            context: NumberContext.ChartSummary,
            translate,
            locale,
            numberContextMetadata,
          }),
          label: getLabel(item, translate),
          tooltip: tooltipKey ? translate(tooltipKey) : null,
        };
      }
      default: {
        const exhaustiveCheck: never = summaryValueType;
        throw new Error(`Unhandled summary value type ${exhaustiveCheck as string}`);
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
    const { unit, formattingSpec } = item;
    // oxlint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    return (!isInLuobuEnvironment && unit === 'robux') ||
      formattingSpec?.icon === NumberIcon.Robux ? (
      <ListItemIcon className={listItemIcon}>
        <RobuxIcon />
      </ListItemIcon>
    ) : null;
  }, [item, summaryValueType, isInLuobuEnvironment, listItemIcon]);

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
