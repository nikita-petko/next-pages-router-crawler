import React, { FC, useEffect, useRef } from 'react';
import useEligibilityCardStyles from './EligibilityCard.styles';

export type BenchmarkSliderThumbProps = {
  thumbGradientColor?: string;
  valueLabelDisplayFormatter: () => React.ReactNode;

  /** thumb props injected by mui Slider */
  children: React.ReactNode;
  'data-index': number;
  className: string;
};

/**
 * The circle representing the value on the slider
 */
const BenchmarkSliderThumb: FC<BenchmarkSliderThumbProps> = ({
  thumbGradientColor,
  className,
  children,
  'data-index': dataIndex,
  ...rest
}: BenchmarkSliderThumbProps) => {
  const {
    classes: { thumbRecordLabel },
  } = useEligibilityCardStyles();
  const benchmarkSliderThumbRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (thumbGradientColor && benchmarkSliderThumbRef.current) {
      benchmarkSliderThumbRef.current.style.setProperty(
        '--thumb-gradient-color',
        thumbGradientColor,
      );
      // Create border color with 15% opacity for the hue ring
      const borderColor =
        thumbGradientColor +
        Math.round(0.15 * 255)
          .toString(16)
          .padStart(2, '0');
      benchmarkSliderThumbRef.current.style.setProperty(
        '--thumb-gradient-border-color',
        borderColor,
      );
    }
  }, [thumbGradientColor]);

  return (
    <span
      ref={benchmarkSliderThumbRef}
      className={className}
      data-index={dataIndex}
      data-testid='benchmark-slider-thumb'
      {...rest}>
      {children}
      <span className={thumbRecordLabel} data-testid='benchmark-slider-record-label' />
    </span>
  );
};

export default BenchmarkSliderThumb;
