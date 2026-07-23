import { makeStyles } from '@rbx/ui';

const useAssistantCardStyles = makeStyles()((theme) => ({
  contentContainer: {
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '100%',
  },
  card: {
    backgroundColor: theme.palette.surface[100],
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: theme.spacing(2, 3),
  },
  headerV2: {
    padding: theme.spacing(2, 0),
  },
  cardContent: {
    flex: 1,
    padding: theme.spacing(0, 3),
    overflow: 'auto',
  },
  titleItem: {
    marginRight: theme.spacing(1),
  },
  disclaimer: {
    padding: theme.spacing(1, 1, 0),
    marginBottom: theme.spacing(0),
    textAlign: 'center',
    width: '100%',
  },
  centrallyAlignItems: {
    alignItems: 'center',
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  fullHeight: {
    height: '100%',
  },
  noPadding: {
    padding: theme.spacing(0),
  },
}));

export default useAssistantCardStyles;
