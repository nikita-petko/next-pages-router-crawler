import { Locale, useLocalization } from '@rbx/intl';
import type { TLabelProps } from '@rbx/ui';
import { ArrowDownwardIcon, ArrowUpwardIcon, Label } from '@rbx/ui';
import useComparisonChipStyles from './ComparisonChip.styles';

interface ComparisonChipProps {
  value: number;
  isStatSig?: boolean;
  isPositiveGood?: boolean;
}

const ComparisonChip = ({
  value,
  isStatSig,
  isPositiveGood = true, // To simplify, as most of our metrics are good when increasing
}: ComparisonChipProps) => {
  const {
    classes: { chipContainer },
  } = useComparisonChipStyles();

  const isValuePositive = value > 0;
  const isValueNegative = value < 0;

  // Add color to label if change is statistically significant
  // Color will be determined by if change direction matches the metric's good direction
  let labelColor: TLabelProps['severity'] = 'default';
  if (isStatSig && value !== 0) {
    if ((isValuePositive && isPositiveGood) || (isValueNegative && !isPositiveGood)) {
      labelColor = 'success';
    } else {
      labelColor = 'error';
    }
  }

  // Add icon in direction of change if the change is statistically significant
  // data-testid has to be set for arrow direction and color unit testing
  // ArrowUpwardIcon and ArrowDownwardIcon are the default data-testid, we only add labelColor
  let icon;
  if (isStatSig && isValuePositive) {
    icon = <ArrowUpwardIcon color='inherit' data-testid={`ArrowUpwardIcon ${labelColor}`} />;
  } else if (isStatSig && isValueNegative) {
    icon = <ArrowDownwardIcon color='inherit' data-testid={`ArrowDownwardIcon ${labelColor}`} />;
  } else {
    icon = undefined;
  }

  const locale = useLocalization().locale ?? Locale.English;
  const percentageFormatter = new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 2,
  });
  const formattedValue = percentageFormatter.format(value);

  return (
    <Label
      icon={icon}
      labelText={formattedValue}
      variant='contained'
      severity={labelColor}
      classes={{ root: chipContainer }}
    />
  );
};

export default ComparisonChip;
