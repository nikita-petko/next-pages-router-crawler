import { makeStyles, TTheme } from '@rbx/ui';

const useEligibilityCardStyles = makeStyles()((theme: TTheme) => {
  const thumbHueWidth = 3;
  const thumbTotalSize = 23;
  const railOrTrackHeight = 10;
  const markLabelArrowSize = Math.sqrt(6 * 6 + 6 * 6);
  const markLabelMarginTop = 8;
  const isDarkTheme = theme.palette.mode === 'dark';

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
    colorPrimary: {
      color: theme.palette.surface.outline,
    },
    thumb: {
      cursor: 'inherit',
      zIndex: 2,
      color: `var(--thumb-gradient-color)`, // for the circle color
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
      backgroundColor: '#335fff',
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
        transition: 'border-color 750ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
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
      transform: `translateX(-100%)`, // Center the label
      textAlign: 'right',
      ...labelFontStyle,
      color: theme.palette.content.muted,
      ...theme.border.radius.small,
      marginTop: `${markLabelMarginTop}px`,
    },
    valueLabel: {
      pointerEvents: 'none',
      transform: `translateY(-150%) !important`, // Center the label
      zIndex: 1000,
      textAlign: 'center',
      ...labelFontStyle,
      color: theme.palette.content.muted,
      ...theme.border.radius.small,
      marginTop: `${markLabelMarginTop}px`,
      backgroundColor: theme.palette.surface[400],
      '&:before': {
        content: '""',
        display: 'block',
        position: 'absolute',
        width: `${markLabelArrowSize}px`,
        height: `${markLabelArrowSize}px`,
        transform: 'translate(-50%, 50%) rotate(45deg)',
        backgroundColor: theme.palette.surface[400],
        left: '50%',
      },
    },
    valueLabelMax: {
      pointerEvents: 'none',
      transform: `translateY(-150%) translateX(-50%) !important`, // Center the label
      zIndex: 1000,
      textAlign: 'center',
      ...labelFontStyle,
      color: theme.palette.content.muted,
      ...theme.border.radius.small,
      marginTop: `${markLabelMarginTop}px`,
      backgroundColor: theme.palette.surface[400],
      '&:before': {
        visibility: 'hidden',
      },
    },
    valueLabelMin: {
      pointerEvents: 'none',
      transform: `translateY(-150%) translateX(50%) !important`, // Center the label
      zIndex: 1000,
      textAlign: 'center',
      ...labelFontStyle,
      color: theme.palette.content.muted,
      ...theme.border.radius.small,
      marginTop: `${markLabelMarginTop}px`,
      backgroundColor: theme.palette.surface[400],
      '&:before': {
        visibility: 'hidden',
      },
    },
  };
});

export default useEligibilityCardStyles;
