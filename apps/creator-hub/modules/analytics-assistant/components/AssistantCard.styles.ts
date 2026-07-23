import { makeStyles } from '@rbx/ui';

// Style scrollbars with the Foundation shift-400 token so the thumb is
// visible against the assistant surfaces while the track stays transparent.
export const ASSISTANT_SCROLLBAR_STYLES = {
  scrollbarColor: 'var(--color-shift-400) transparent',
  scrollbarWidth: 'thin' as const,
  '&::-webkit-scrollbar': {
    width: 8,
    height: 8,
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'var(--color-shift-400)',
    borderRadius: 'var(--radius-circle)',
  },
};

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
  headerAction: {
    // Cancel MUI CardHeader's default negative margins so the action
    // (e.g. the close button on the canvas card) lines up with the
    // CardContent's horizontal padding edge instead of sticking out past it.
    margin: 0,
    alignSelf: 'center',
  },
  headerV2: {
    padding: theme.spacing(2, 0),
  },
  cardContent: {
    flex: 1,
    padding: theme.spacing(0, 3),
    overflow: 'auto',
    ...ASSISTANT_SCROLLBAR_STYLES,
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
