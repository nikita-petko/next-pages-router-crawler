import React, { FC, useCallback, useMemo } from 'react';
import { Container, Slider } from '@rbx/ui';
import { FormattedText } from '@modules/analytics-translations';
import useBenchmarkStaticSliderStyles from './BenchmarkStaticSlider.styles';
import BenchmarkSliderThumb from './BenchmarkSliderThumb';
import { BenchmarkStaticSliderProps } from './types';
import ordinalizePercentileByLocale from '../../utils/ordinalizePercentileByLocale';
import useLocale from '../../context/useLocale';
import { getGradientColorAtPercentile } from '../../utils/gradientColorInterpolation';
import { benchmarkSliderColor } from '../../charts/constants';

const defaultValueFormatter = (value: number) => `${value}` as FormattedText;

/**
 * V2 Benchmark slider component using a single MUI Slider with visual segments.
 * This approach solves animation issues by having one continuous slider element
 * with CSS styling to create the appearance of separate segments.
 *
 * Benefits:
 * - Smooth animations across segment boundaries
 * - Single slider component (simpler architecture)
 * - Better performance
 * - Leverages MUI's built-in animations
 *
 */
const BenchmarkStaticSlider: FC<BenchmarkStaticSliderProps> = ({
  record,
  stops,
  valueFormatter = defaultValueFormatter,
}) => {
  const {
    classes: {
      benchmarkSliderContainer,
      markLabelContainer,
      benchmarkSlider,
      gapElement,
      thumb,
      rail,
      track,
      mark,
      markLabel,
      colorPrimary,
    },
  } = useBenchmarkStaticSliderStyles();
  const locale = useLocale();

  // Red-yellow-green gradient for default behavior
  const redYellowGreenGradientColors = useMemo(
    () => [
      benchmarkSliderColor.red,
      benchmarkSliderColor.yellow,
      benchmarkSliderColor.lightGreen,
      benchmarkSliderColor.spacer,
      benchmarkSliderColor.green,
    ],
    [],
  );

  const thumbGradientColor = useMemo(() => {
    // Use red-yellow-green solid color when flag is enabled
    return getGradientColorAtPercentile(redYellowGreenGradientColors, record.percentile);
  }, [record.percentile, redYellowGreenGradientColors]);

  // Create marks at segment boundaries
  const marks = useMemo(() => {
    return stops.map(({ value, percentile }) => ({
      value: percentile,
      label: (
        <Container
          classes={{ root: markLabelContainer }}
          disableGutters
          data-testid='benchmark-slider-mark'>
          <div>{ordinalizePercentileByLocale(percentile, locale)}</div>
          {valueFormatter(value)}
        </Container>
      ),
    }));
  }, [stops, markLabelContainer, locale, valueFormatter]);

  // Use single value for track positioning - always the current record
  const value = record.percentile;

  // Simplified formatter - no conditional logic needed in V2
  const valueLabelDisplayFormatter = useCallback(
    () => <div>{ordinalizePercentileByLocale(record.percentile, locale)}</div>,
    [record.percentile, locale],
  );

  // Generate gap positions for SVG mask approach
  const gapPositions = useMemo(() => stops.map(({ percentile }) => percentile), [stops]);

  // Generate SUBTRACTIVE SVG mask to replicate separate segments with border radius
  // Control the gap size by changing the SVG shapes and viewBox
  // ex. for a 5px border radius and a 6px gap we need 5 + 5 + 6 = 16px width for the SVG viewBox,
  //     rect 16px wide, and two circles at 0 and 16px respectively, each with a radius of 5px.
  const gapMask = useMemo(() => {
    const svgMask = `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 12">
        <defs>
          <mask id="gapMask">
            <rect width="16" height="12" fill="white"/>
            <circle cx="0" cy="6" r="5" fill="black"/>
            <circle cx="16" cy="6" r="5" fill="black"/>
          </mask>
        </defs>
        <rect width="16" height="12" mask="url(#gapMask)" fill="white"/>
      </svg>
    `)}`;

    return `url("${svgMask}")`;
  }, []);

  // Generate track style based on feature flag
  const trackStyle = useMemo(() => {
    const baseStyle = {
      left: 0,
      width: `${value}%`,
    };

    // Use solid red-yellow-green color when flag is enabled
    const solidColor = getGradientColorAtPercentile(
      redYellowGreenGradientColors,
      record.percentile,
    );
    return {
      ...baseStyle,
      background: solidColor,
    };
  }, [value, redYellowGreenGradientColors, record.percentile]);

  return (
    <Container classes={{ root: benchmarkSliderContainer }} disableGutters maxWidth={false}>
      <div className={benchmarkSlider}>
        <Slider
          data-testid='benchmark-slider-v2'
          aria-label='benchmark-slider-v2'
          value={value}
          track='normal'
          classes={{
            thumb,
            rail,
            track,
            colorPrimary,
            mark,
            markLabel,
          }}
          slots={{
            thumb: BenchmarkSliderThumb,
          }}
          slotProps={{
            track: {
              style: trackStyle,
            },
            thumb: {
              thumbGradientColor,
              valueLabelDisplayFormatter,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any -- MUI will inject missing props at runtime
            } as any,
          }}
          marks={marks}
          max={100}
          min={0}
        />

        {/* Dynamically generated gap elements - positioned to align with track/rail */}
        {gapPositions.map((position) => (
          <div
            key={`gap-${position}`}
            className={gapElement}
            style={{
              left: `${position}%`,
              maskImage: gapMask,
              WebkitMaskImage: gapMask,
            }}
            data-testid='benchmark-slider-gap'
          />
        ))}
      </div>
    </Container>
  );
};

export default BenchmarkStaticSlider;
