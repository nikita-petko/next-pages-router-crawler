import { makeStyles } from '@rbx/ui';
import { ASSISTANT_SCROLLBAR_STYLES } from '@modules/analytics-assistant/components/AssistantCard.styles';

const useAIChatInterfaceStyles = makeStyles()((theme) => ({
  contentContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    flex: 1,
  },
  alertWithSpacing: {
    marginBottom: theme.spacing(2),
    marginTop: '64px',
  },
  alertDefault: {
    marginBottom: theme.spacing(2),
    marginTop: 0,
  },
  dividerWithSpacing: {
    marginBottom: theme.spacing(2),
  },
  card: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: 'transparent',
  },

  cardContent: {
    flex: 1,
    padding: theme.spacing(0, 3),
    // Positioning context for the floating composer; the message list is the
    // scroller, so this container clips rather than scrolls.
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    // Override MUI's default `&:last-child { padding-bottom: 24px }`.
    '&:last-child': {
      paddingBottom: 0,
    },
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    minHeight: 0,
    padding: theme.spacing(1, 0),
    ...ASSISTANT_SCROLLBAR_STYLES,
  },
  // The composer (review chip + clarifying-question card + input + disclaimer)
  // floats over the bottom of the transcript so messages scroll behind it; its
  // background fades in at the top so the transition reads as sliding under.
  composer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(0, 3),
    backgroundColor: 'var(--color-surface-0)',
    '&::before': {
      content: '""',
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height: theme.spacing(2),
      transform: 'translateY(-100%)',
      background: 'linear-gradient(to top, var(--color-surface-0), transparent)',
      pointerEvents: 'none',
    },
  },
  messagesContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    '& > *': {
      flexShrink: 0,
    },
  },
  messageWrapper: {
    width: '100%',
    display: 'flex',
    marginBottom: theme.spacing(2),
  },
  userMessageWrapper: {
    justifyContent: 'flex-end',
    paddingRight: theme.spacing(1),
  },
  assistantMessageWrapper: {
    justifyContent: 'flex-start',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  messageCard: {
    display: 'block',
    padding: theme.spacing(2.5),
    maxWidth: '85%',
    flexShrink: 0,
    '& p:first-of-type': {
      marginTop: 0,
    },
    '& p:last-of-type': {
      marginBottom: 0,
    },
  },
  userMessageCard: {
    textAlign: 'left',
    color: theme.palette.content.standard,
    backgroundColor: 'var(--color-shift-100)',
    padding: 'var(--padding-medium)',
    borderRadius: '20px',
  },
  assistantMessageCard: {
    color: theme.palette.actionV2.primary.fill,
    background: 'transparent',
    borderRadius: '20px',
    maxWidth: '100%',
    padding: 'var(--padding-medium)',
  },
  interactiveAssistantMessageCard: {
    border: 0,
    cursor: 'pointer',
    font: 'inherit',
    textAlign: 'left',
    transition: 'background-color 120ms ease',
    '&:hover, &:focus-visible': {
      backgroundColor: 'var(--color-shift-100)',
    },
    '&:focus-visible': {
      outline: '1px solid var(--color-stroke-default)',
      outlineOffset: theme.spacing(0.5),
    },
  },
  chartIndicator: {
    color: theme.palette.actionV2.primaryBrand.fill,
    fontSize: '0.75rem',
    marginTop: theme.spacing(0.5),
  },
}));

export default useAIChatInterfaceStyles;
