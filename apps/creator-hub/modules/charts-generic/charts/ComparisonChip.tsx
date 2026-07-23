import type { FunctionComponent } from 'react';
import { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { ArrowUpwardIcon, ArrowDownwardIcon, Tooltip, Label } from '@rbx/ui';
import {
  type FormattedText,
  TranslationKeyOrFormattedTextType,
} from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import useLocale from '../context/useLocale';
import useComparisonChipStyles from './ComparisonChip.styles';
import type { TNumberContextMetadata } from './numberFormatters';
import { formatNumberWithSpec } from './numberFormatters';

export type ComparisonChipSpec = {
  isUp: boolean;
  isGood: boolean;
  percentage: number;
  tooltip?: string;
  hasBackground?: boolean;
  useWarningBackgroundWhenNotGood?: boolean;
  numberContextMetadata?: TNumberContextMetadata;
  maximumDecimals?: number;
  /**
   * If true, always use the dimmed label color, regardless of isGood.
   */
  dimmedLabel?: boolean;
};

const comparisonChipMaxPercentage = 10; // = 1000%

const ComparisonChip: FunctionComponent<ComparisonChipSpec> = ({
  isGood,
  isUp,
  percentage,
  tooltip,
  numberContextMetadata,
  maximumDecimals = 1,
  dimmedLabel = false,
  hasBackground = false,
  useWarningBackgroundWhenNotGood = false,
}) => {
  const locale = useLocale();
  const { translate } = useTranslationWrapper(useTranslation());
  const {
    classes: { icon, labelColor, tooltipWrapper },
  } = useComparisonChipStyles({
    isGood,
    hasBackground,
    dimmedLabel,
    useWarningBackgroundWhenNotGood,
  });

  const formattedNumber = useMemo(() => {
    const isOverflow = Math.abs(percentage) > comparisonChipMaxPercentage;
    const numberToShow = isOverflow ? comparisonChipMaxPercentage : percentage;
    // NOTE(gperkins@20240910): percentage is positive right now due to isUp, but it's not guaranteed
    const prefixIfOverflow = numberToShow > 0 ? '>' : '<';
    const prefixText = (isOverflow ? prefixIfOverflow : '') as FormattedText;

    const minimumFractionDigits = numberContextMetadata?.inRoundedComparisonChipContext ? 0 : 1;
    const maximumFractionDigits = numberContextMetadata?.inRoundedComparisonChipContext
      ? 0
      : maximumDecimals;

    return formatNumberWithSpec(
      numberToShow,
      {
        abbreviate: false,
        numberFormatOptions: {
          style: 'percent',
          minimumFractionDigits,
          maximumFractionDigits,
        },
        prefix: prefixText
          ? {
              type: TranslationKeyOrFormattedTextType.DynamicFormattedText,
              text: prefixText,
            }
          : undefined,
      },
      {
        locale,
        translate,
      },
    );
  }, [
    locale,
    maximumDecimals,
    numberContextMetadata?.inRoundedComparisonChipContext,
    percentage,
    translate,
  ]);

  const label = useMemo(() => {
    return (
      <Label
        labelText={formattedNumber}
        variant={hasBackground ? 'contained' : 'text'}
        icon={isUp ? <ArrowUpwardIcon className={icon} /> : <ArrowDownwardIcon className={icon} />}
        classes={{ root: labelColor }}
      />
    );
  }, [formattedNumber, hasBackground, icon, isUp, labelColor]);

  return tooltip ? (
    <Tooltip title={tooltip} placement='right' arrow>
      {/* Note(shumingxu, 02/13/2024): need to wrap label in div for tooltip ref to work */}
      <div className={tooltipWrapper}>{label}</div>
    </Tooltip>
  ) : (
    label
  );
};
export default ComparisonChip;
