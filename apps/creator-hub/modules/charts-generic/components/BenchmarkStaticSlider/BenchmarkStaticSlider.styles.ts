import type { TTheme } from '@rbx/ui';
import { makeStyles } from '@rbx/ui';
import { benchmarkSliderColor } from '../../charts/constants';
import { getChartThemedColors } from '../../charts/options';

const useBenchmarkStaticSliderStyles = makeStyles()((theme: TTheme) => {
  const thumbHueWidth = 3;
  const thumbTotalSize = 23;
  const railOrTrackHeight = 10;
  const markLabelArrowSize = Math.sqrt(6 * 6 + 6 * 6);
  const markLabelMarginTop = 8;
  const isDarkTheme = theme.palette.mode === 'dark';
  const chartThemedColors = getChartThemedColors(theme);

  const hexColor = (hex: string, opacity = 1) => `${hex}${Math.round(opacity * 255).toString(16)}`;

  const labelFontStyle = {
    ...theme.typography.smallLabel2,
    fontWeight: 700,
    lineHeight: '17px',
  };

  return {
    benchmarkSliderContainer: {
      display: 'block',
      width: '100%',
      alignItems: 'baseline',
    },
    benchmarkSlider: {
      width: '100%',
      position: 'relative',
      marginBottom: '28px',
      marginTop: '18px',
      cursor: 'inherit',
    },
    gapElement: {
      position: 'absolute',
      top: 'calc(50% - 11.5px)', // Center vertically within the slider container
      transform: 'translate(-50%, -50%)', // Center both horizontally and vertically
      width: '18px',
      height: '12px',
      background: theme.palette.surface[0],
      zIndex: 0, // Above track but below MUI's hover overlay
      pointerEvents: 'none',
      // Apply subtractive curved I-shape mask
      maskSize: '18px 12px',
      WebkitMaskSize: '18px 12px',
      maskRepeat: 'no-repeat',
      WebkitMaskRepeat: 'no-repeat',
      maskPosition: 'center',
      WebkitMaskPosition: 'center',
    },
    colorDefault: {
      color: hexColor(benchmarkSliderColor.default),
    },
    colorPrimary: {
      color: theme.palette.surface.outline,
    },
    thumb: {
      cursor: 'inherit',
      zIndex: 2,
      color: `var(--thumb-gradient-color, ${hexColor(benchmarkSliderColor.default)})`,
      position: 'absolute',
      width: thumbTotalSize - thumbHueWidth * 2,
      height: thumbTotalSize - thumbHueWidth * 2,
      boxSizing: 'border-box',
      borderRadius: '50%',
      outline: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transform: `translate(-50%, -50%)`,
      top: '50%',
      transition:
        'color 750ms cubic-bezier(0.4, 0, 0.2, 1), left 750ms cubic-bezier(0.4, 0, 0.2, 1)',
      backgroundColor: 'currentcolor',
      boxShadow: theme.elevation.subtle,
      border: `2px solid ${theme.palette.content.standard}`,
      '&::before': {
        position: 'absolute',
        content: '""',
        borderRadius: 'inherit',
        width: thumbTotalSize,
        height: thumbTotalSize,
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%)`,
        border: `${thumbHueWidth}px solid var(--thumb-gradient-border-color, ${hexColor(benchmarkSliderColor.default, 0.15)})`,
        transition: 'border-color 750ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
    thumbHidden: {
      display: 'none',
    },
    thumbRecordLabel: {
      position: 'absolute',
      textAlign: 'center',
      ...labelFontStyle,
      marginBottom: '6px',
      transformOrigin: 'bottom center',
      transform: `translateY(calc(-${thumbTotalSize / 2}px - 50%))`,
      color: isDarkTheme ? theme.palette.common.white : theme.palette.common.black,
      textWrap: 'nowrap',
    },
    track: {
      cursor: 'inherit',
      height: `${railOrTrackHeight}px`,
      border: 0,
      transition:
        'width 750ms cubic-bezier(0.4, 0, 0.2, 1), background-size 750ms cubic-bezier(0.4, 0, 0.2, 1), background 750ms cubic-bezier(0.4, 0, 0.2, 1), background-color 750ms cubic-bezier(0.4, 0, 0.2, 1)',
      borderRadius: '5px',
    },
    rail: {
      cursor: 'inherit',
      height: `${railOrTrackHeight}px`,
      ...theme.border.radius.medium,
      color: theme.palette.surface.outline,
    },
    mark: {
      display: 'none',
    },
    markLabel: {
      pointerEvents: 'none',
      transform: `translateX(-50%)`, // Center the label
      textAlign: 'center',
      ...labelFontStyle,
      color: theme.palette.content.muted,
      ...theme.border.radius.small,
      marginTop: `${markLabelMarginTop}px`,
      backgroundColor: chartThemedColors.benchmarkMarkLabelBackground,
      '&:before': {
        content: '""',
        display: 'block',
        position: 'absolute',
        width: `${markLabelArrowSize}px`,
        height: `${markLabelArrowSize}px`,
        transform: 'translate(-50%, -50%) rotate(45deg)',
        backgroundColor: chartThemedColors.benchmarkMarkLabelBackground,
        left: '50%',
      },
    },
    markLabelContainer: {
      padding: '4px 8px',
    },
  };
});

export default useBenchmarkStaticSliderStyles;
