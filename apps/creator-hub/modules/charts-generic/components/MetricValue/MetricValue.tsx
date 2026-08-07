import type { FC } from 'react';
import React, { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import type { TGridProps, TTypographyProps } from '@rbx/ui';
import { Grid, RobuxIcon, Typography } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { brandUntranslatableText } from '@modules/analytics-translations/wrapperFunctions';
import type { ComparisonChipSpec } from '../../charts/ComparisonChip';
import ComparisonChip from '../../charts/ComparisonChip';
import type { TFormattingSpec, TNumberContextMetadata } from '../../charts/numberFormatters';
import { formatNumberWithSpec, NumberIcon } from '../../charts/numberFormatters';
import useLocale from '../../context/useLocale';
import useMetricValueStyles from './MetricValue.styles';

export type MetricValueSpec = {
  value: number | null;
  analyticsFormattingSpec?: TFormattingSpec;
  comparisonChipSpec?: ComparisonChipSpec;
  typographySpec?: TTypographyProps;
  showComparisonChipAfterValue?: boolean;
  justifyContent?: TGridProps['justifyContent'];
  numberContextMetadata?: TNumberContextMetadata;
};

type AllowedIcons = FC<React.ComponentProps<typeof RobuxIcon>>;
const chartUnitIcons: Record<NumberIcon, AllowedIcons> = {
  [NumberIcon.Robux]: RobuxIcon,
};

export const noDataSymbol = brandUntranslatableText('--');

const MetricValue: FC<MetricValueSpec> = ({
  value,
  analyticsFormattingSpec,
  comparisonChipSpec,
  typographySpec,
  showComparisonChipAfterValue = false,
  justifyContent,
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
    return value;
  }, [value, analyticsFormattingSpec, locale, translate]);

  const comparisonChip = comparisonChipSpec && (
    <div className={comparisonChipMargin} data-testid='comparison-chip'>
      <ComparisonChip {...comparisonChipSpec} />
    </div>
  );

  const Icon = analyticsFormattingSpec?.icon
    ? chartUnitIcons[analyticsFormattingSpec.icon]
    : undefined;

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
