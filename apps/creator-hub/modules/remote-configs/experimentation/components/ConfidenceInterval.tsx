import type { CSSProperties } from 'react';
import { useCallback, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { makeStyles, Slider, sliderClasses, Typography } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { formatNumberWithSpec } from '@modules/charts-generic/charts/numberFormatters';
import useLocale from '@modules/charts-generic/context/useLocale';

const useStyles = makeStyles()((theme) => ({
  hidden: {
    display: 'none',
  },
  root: {
    transform: 'translateY(-12px)',
    width: '100%',
  },
  markLabel: {
    color: theme.palette.content.standard,
  },
  // Interval styles
  intervalRoot: {
    margin: '0',
    width: '100%',
  },
  intervalTrack: {
    position: 'absolute',
    height: '24px',
    ...theme.border.radius.small,
    minWidth: '4px',
  },
  intervalTrackGreen: {
    backgroundColor: '#44DA87',
  },
  intervalTrackRed: {
    backgroundColor: '#F45B52',
  },
  intervalTrackYellow: {
    backgroundColor: '#F2F2F3',
  },
  intervalMetricValueLabel: {
    color: theme.palette.content.standard,
    position: 'absolute',
    transform: 'translateX(-50%)',
    top: '-100%',
    textAlign: 'center',
  },
  intervalMinValueLabel: {
    color: theme.palette.content.standard,
    position: 'absolute',
    left: '0',
    top: '50%',
    transform: 'translateX(calc(-4px - 100%)) translateY(-50%)',
    textAlign: 'center',
  },
  intervalMaxValueLabel: {
    color: theme.palette.content.standard,
    position: 'absolute',
    right: '0',
    top: '50%',
    transform: 'translateX(calc(4px + 100%)) translateY(-50%)',
    textAlign: 'center',
  },
  intervalVerticalLine: {
    position: 'absolute',
    top: '0',
    height: '100%',
    border: `0.5px solid ${theme.palette.surface[100]}`,
  },
}));

export const ConfidenceIntervalCellHeader = ({ marks }: { marks: number[] }) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const locale = useLocale();
  const {
    classes: { hidden, root, markLabel },
  } = useStyles();

  const marksWithLabels = useMemo(() => {
    return marks.map((mark) => ({
      value: mark,
      label: formatNumberWithSpec(
        mark,
        {
          abbreviate: false,
          numberFormatOptions: {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
            style: 'percent',
          },
        },
        { locale, translate },
      ),
    }));
  }, [marks, locale, translate]);

  return (
    <Slider
      aria-label='confidence-interval-slider-cell-header'
      classes={{
        thumb: hidden,
        track: hidden,
        rail: hidden,
        mark: hidden,
        root,
        markLabel,
      }}
      marks={marksWithLabels}
      min={marks[0]}
      max={marks[marks.length - 1]}
      disabled
    />
  );
};

const IntervalTrack = ({
  metricValueLiftPercentage,
  valueLabelFormat,
  style: positionStyle,
  ownerState,
}: {
  metricValueLiftPercentage: number;
  valueLabelFormat: ({ value }: { value: number }) => string;

  // props injected by mui slider
  style: CSSProperties;
  ownerState: {
    value: [number, number];
  };
}) => {
  const {
    classes: {
      intervalTrack,
      intervalTrackGreen,
      intervalTrackRed,
      intervalTrackYellow,
      intervalMetricValueLabel,
      intervalMinValueLabel,
      intervalMaxValueLabel,
      intervalVerticalLine,
    },
    cx,
  } = useStyles();

  const [min, max] = ownerState.value;

  const className = useMemo(() => {
    let status: 'error' | 'success' | 'warning' = 'success';
    if (max < 0) {
      status = 'error';
    } else if (min > 0) {
      status = 'success';
    } else {
      status = 'warning';
    }

    return cx(sliderClasses.track, intervalTrack, {
      [intervalTrackGreen]: status === 'success',
      [intervalTrackRed]: status === 'error',
      [intervalTrackYellow]: status === 'warning',
    });
  }, [cx, intervalTrack, intervalTrackGreen, intervalTrackRed, intervalTrackYellow, min, max]);

  const metricValueRelativePosition = useMemo(
    () => `${((metricValueLiftPercentage - min) / (max - min)) * 100}%`,
    [max, metricValueLiftPercentage, min],
  );
  return (
    <span className={className} style={positionStyle}>
      {/* Vertical line in middle of the interval */}
      <div
        className={intervalVerticalLine}
        style={{
          left: metricValueRelativePosition,
        }}
      />
      {/* Metric value label above the interval */}
      <Typography
        variant='smallLabel1'
        component='div'
        classes={{
          root: intervalMetricValueLabel,
        }}
        style={{
          left: metricValueRelativePosition,
        }}>
        {valueLabelFormat({ value: metricValueLiftPercentage })}
      </Typography>
      {/* Min value label on left side of the interval */}
      <Typography
        variant='smallLabel1'
        component='div'
        classes={{
          root: intervalMinValueLabel,
        }}>
        {valueLabelFormat({ value: min })}
      </Typography>
      {/* Max value label on right side of the interval */}
      <Typography
        variant='smallLabel1'
        component='div'
        classes={{
          root: intervalMaxValueLabel,
        }}>
        {valueLabelFormat({ value: max })}
      </Typography>
    </span>
  );
};

export const ConfidenceIntervalCellContent = ({
  marks: givenMarks,
  metricValueLiftPercentage,
  interval,
}: {
  marks: number[];
  metricValueLiftPercentage: number;
  interval: [number, number];
}) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const locale = useLocale();

  const {
    classes: { hidden, intervalTrack, intervalRoot },
  } = useStyles();

  const marks = useMemo(() => {
    return givenMarks.map((mark) => ({ value: mark }));
  }, [givenMarks]);

  const valueLabelFormat = useCallback(
    ({ value }: { value: number }) =>
      formatNumberWithSpec(
        value,
        {
          abbreviate: false,
          numberFormatOptions: {
            minimumFractionDigits: 1,
            maximumFractionDigits: 2,
            style: 'percent',
          },
        },
        { locale, translate },
      ),
    [locale, translate],
  );

  const { slots, slotProps } = useMemo(() => {
    return {
      slots: {
        track: IntervalTrack,
      },
      slotProps: {
        track: {
          metricValueLiftPercentage,
          valueLabelFormat,
        },
      },
    };
  }, [metricValueLiftPercentage, valueLabelFormat]);

  return (
    <Slider
      aria-label='confidence-interval-slider-cell-content'
      classes={{
        root: intervalRoot,
        track: intervalTrack,
        thumb: hidden,
        rail: hidden,
        mark: hidden,
        markLabel: hidden,
      }}
      marks={marks}
      min={givenMarks[0]}
      max={givenMarks[marks.length - 1]}
      value={interval}
      slots={slots}
      slotProps={slotProps}
      disabled
    />
  );
};
