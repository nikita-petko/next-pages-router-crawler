import { TTheme, makeStyles } from '@rbx/ui';

const getBackgroundColor = (isGood: boolean, hasBackground: boolean, theme: TTheme) => {
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
    color = theme.palette.components.alert.activeContent;
    iconStroke = theme.palette.components.alert.activeContent;
  } else if (!isGood && useWarningBackgroundWhenNotGood) {
    color = theme.palette.components.alert.importantContent;
    iconStroke = theme.palette.components.alert.importantContent;
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
