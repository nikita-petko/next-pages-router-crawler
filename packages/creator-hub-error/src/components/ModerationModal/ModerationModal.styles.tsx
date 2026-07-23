import { makeStyles } from '@rbx/ui';

const useModerationModalStyles = makeStyles()((theme) => ({
  image: {
    maxWidth: 212,
    maxHeight: 212,
    borderRadius: 8,
  },
  boldText: {
    fontWeight: theme.typography.fontWeightBold,
  },
  moderatorNote: {
    maxWidth: 900,
  },
  alert: {
    marginLeft: 20,
    marginRight: 20,
  },
}));

export default useModerationModalStyles;
