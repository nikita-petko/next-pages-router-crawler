import { makeStyles } from '@rbx/ui';

const useLabelStyles = makeStyles()((theme) => ({
  // Size styling
  defaultTextSize: {
    ...theme.typography.smallLabel2,
    fontSize: 12,
  },
  largeTextSize: {
    ...theme.typography.smallLabel2,
    fontSize: 16,
  },
  mediumBodyTextSize: {
    ...theme.typography.body2,
    fontSize: 14,
  },

  // Variant styling
  defaultBackgroundColor: {
    backgroundColor: theme.palette.surface[300],
  },
  error: {
    backgroundColor: theme.palette.components.alert.importantFill,
    color: theme.palette.components.alert.importantContent,
  },
  success: {
    backgroundColor: theme.palette.components.alert.activeFill,
    color: theme.palette.components.alert.activeContent,
  },
  warning: {
    backgroundColor: theme.palette.components.alert.noticeFill,
    color: theme.palette.components.alert.noticeContent,
  },
  alert: {
    backgroundColor: theme.palette.components.alert.informFill,
    color: theme.palette.components.alert.informContent,
  },
}));

export default useLabelStyles;
