import type { TTheme } from '@rbx/ui';
import { makeStyles } from '@rbx/ui';

const getBackgroundColor = (
  isGood: boolean,
  hasBackground: boolean,
  theme: TTheme,
): string | undefined => {
  if (!hasBackground) {
    return undefined;
  }
  if (isGood) {
    return theme.palette.components.alert.activeFill;
  }
  return theme.palette.surface.outline;
};

const useComparisonChipStyles = makeStyles<{
  isGood: boolean;
  dimmedLabel: boolean;
  hasBackground: boolean;
  useWarningBackgroundWhenNotGood?: boolean;
}>()((theme, { isGood, hasBackground, dimmedLabel, useWarningBackgroundWhenNotGood }) => {
  const backgroundColor = getBackgroundColor(isGood, hasBackground, theme);

  let color = theme.palette.content.standard;
  let iconStroke = theme.palette.content.standard;

  if (dimmedLabel) {
    color = theme.palette.content.muted;
    iconStroke = theme.palette.content.muted;
  } else if (isGood) {
    color = theme.palette.content.alert.active;
    iconStroke = theme.palette.content.alert.active;
  } else if (!isGood && useWarningBackgroundWhenNotGood) {
    color = theme.palette.content.alert.important;
    iconStroke = theme.palette.content.alert.important;
  }

  return {
    labelColor: {
      color,
      backgroundColor,
      lineHeight: '140%',
    },
    icon: {
      stroke: iconStroke,
    },
    tooltipWrapper: { display: 'inline-block' },
  };
});

export default useComparisonChipStyles;
