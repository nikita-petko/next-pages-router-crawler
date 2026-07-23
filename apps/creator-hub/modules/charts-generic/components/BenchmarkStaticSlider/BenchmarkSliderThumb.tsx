import type { FC } from 'react';
import React, { useEffect, useRef } from 'react';
import { Tooltip } from '@rbx/ui';
import useBenchmarkStaticSliderStyles from './BenchmarkStaticSlider.styles';

export type BenchmarkSliderThumbProps = {
  thumbGradientColor?: string;
  valueLabelDisplayFormatter: () => React.ReactNode;

  /** thumb props injected by mui Slider */
  children: React.ReactNode;
  'data-index': number;
  className: string;
};

/**
 * A benchmark slider thumb is:
 *     slider thumb
 *          ⬆
 * (________O___) (________) (___)
 *             50th       90th
 * see BenchmarkStaticSlider.tsx for more details.
 */
const BenchmarkSliderThumb: FC<BenchmarkSliderThumbProps> = ({
  thumbGradientColor,
  className,
  children,
  'data-index': dataIndex,
  valueLabelDisplayFormatter,
  ...rest
}: BenchmarkSliderThumbProps) => {
  const {
    classes: { thumbRecordLabel },
  } = useBenchmarkStaticSliderStyles();
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

  const valueLabel = valueLabelDisplayFormatter();

  return (
    <Tooltip title={valueLabel} arrow placement='top'>
      <span
        ref={benchmarkSliderThumbRef}
        className={className}
        data-index={dataIndex}
        data-testid='benchmark-slider-thumb'
        {...rest}>
        {children}
        <span className={thumbRecordLabel} data-testid='benchmark-slider-record-label'>
          {valueLabel}
        </span>
      </span>
    </Tooltip>
  );
};

export default BenchmarkSliderThumb;
