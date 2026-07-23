import type { FC } from 'react';
import React, { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import type { TGridProps, TTypographyProps } from '@rbx/ui';
import { Grid, RobuxIcon, Typography } from '@rbx/ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import type { ComparisonChipSpec } from '../../charts/ComparisonChip';
import ComparisonChip from '../../charts/ComparisonChip';
import type {
  NumberContext,
  TFormattingSpec,
  TNumberContextMetadata,
} from '../../charts/numberFormatters';
import { formatNumber, formatNumberWithSpec, NumberIcon } from '../../charts/numberFormatters';
import type { ChartUnitAggregationType } from '../../charts/types/ChartTypes';
import { ChartUnit } from '../../charts/types/ChartTypes';
import useLocale from '../../context/useLocale';
import useMetricValueStyles from './MetricValue.styles';

export type FormattingSpec = {
  unit: ChartUnit;
  type: ChartUnitAggregationType;
  context: NumberContext;
};

export type MetricValueSpec = {
  value: number | null;
  // @deprecated Use analyticsFormattingSpec instead. Will be removed in DSA-4660.
  formattingSpec?: FormattingSpec;
  analyticsFormattingSpec?: TFormattingSpec;
  isInLuobuEnvironment?: boolean;
  comparisonChipSpec?: ComparisonChipSpec;
  typographySpec?: TTypographyProps;
  showComparisonChipAfterValue?: boolean;
  justifyContent?: TGridProps['justifyContent'];
  numberContextMetadata?: TNumberContextMetadata;
};

// Get type of FC type of icons since props type is not exported
type AllowedIcons = FC<React.ComponentProps<typeof RobuxIcon>>;
const chartUnitIcons: Map<ChartUnit, AllowedIcons> = new Map([[ChartUnit.Robux, RobuxIcon]]); // Add more icons here
const newChartUnitIcons: Record<NumberIcon, AllowedIcons> = {
  [NumberIcon.Robux]: RobuxIcon,
}; // Add more icons here

export const noDataSymbol = '--' as FormattedText;

// NOTE(shumingxu, 10/19/2023): After talking with @gperkins going forward this
// will only be used for UI decorations and not number formatting
const MetricValue: FC<MetricValueSpec> = ({
  value,
  formattingSpec,
  analyticsFormattingSpec,
  comparisonChipSpec,
  typographySpec,
  showComparisonChipAfterValue = false,
  justifyContent,
  numberContextMetadata,
}) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const locale = useLocale();

  const {
    classes: { comparisonChipMargin, iconPadding },
  } = useMetricValueStyles();
  const formattedValue = useMemo(() => {
    if (value === null) {
      return noDataSymbol;
    }
    if (analyticsFormattingSpec) {
      return formatNumberWithSpec(value, analyticsFormattingSpec, { locale, translate });
    }
    if (formattingSpec) {
      // TODO(DSA-4660): Remove legacy formatNumber path after formatter migration.
      return formatNumber({
        value,
        ...formattingSpec,
        locale,
        translate,
        numberContextMetadata,
      });
    }
    return value;
  }, [value, analyticsFormattingSpec, formattingSpec, locale, translate, numberContextMetadata]);

  const comparisonChip = comparisonChipSpec && (
    <div className={comparisonChipMargin} data-testid='comparison-chip'>
      <ComparisonChip {...comparisonChipSpec} />
    </div>
  );

  const LegacyIcon = formattingSpec?.unit ? chartUnitIcons.get(formattingSpec?.unit) : undefined;
  const NewIcon = analyticsFormattingSpec?.icon
    ? newChartUnitIcons[analyticsFormattingSpec?.icon]
    : undefined;
  const Icon = NewIcon ?? LegacyIcon;

  return (
    <Grid
      container
      direction='row'
      alignItems='center'
      justifyContent={justifyContent}
      wrap='nowrap'>
      {!showComparisonChipAfterValue && comparisonChip}
      {Icon && <Icon className={iconPadding} fontSize='small' data-testid='icon' />}
      <Typography variant='body1' {...typographySpec} data-testid='formatted-value'>
        {formattedValue}
      </Typography>
      {showComparisonChipAfterValue && comparisonChip}
    </Grid>
  );
};

export default MetricValue;
