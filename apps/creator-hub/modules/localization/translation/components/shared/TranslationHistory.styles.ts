import { makeStyles } from '@rbx/ui';

const useTranslationHistoryStyles = makeStyles()((theme) => ({
  container: {
    padding: theme.spacing(2, 0, 2, 0),
  },

  grid: {
    paddingTop: 15,
  },

  entry: {
    paddingBottom: 10,
  },

  text: {
    color: theme.palette.content.disabled,
    overflowWrap: 'anywhere',
  },

  divider: {
    opacity: 0.5,
    marginBottom: 10,
  },

  emptyText: {
    color: theme.palette.content.disabled,
  },

  errorGrid: {
    paddingTop: theme.spacing(1),
  },

  errorText: {
    marginLeft: theme.spacing(2 / 3),
  },

  link: {
    color: theme.palette.content.standard,
  },

  metadataContainter: {
    marginBottom: 10,
  },
}));

export default useTranslationHistoryStyles;
