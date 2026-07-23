import { makeStyles } from '@rbx/ui';

const useAIChatInterfaceStyles = makeStyles()((theme) => ({
  contentContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    flex: 1,
  },
  relativeCardContent: {
    position: 'relative',
  },
  assistantTitle: {
    position: 'absolute',
    top: '16px',
    left: '24px',
    zIndex: 1,
  },
  spacer: {
    height: '64px',
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
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2),
    padding: theme.spacing(1, 0),
    minHeight: 0,
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
  },
  messageCard: {
    display: 'block',
    fontSize: 16,
    padding: theme.spacing(2.5),
    maxWidth: '85%',
    flexShrink: 0,
    '& *': {
      overflowWrap: 'break-word',
    },
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
    backgroundColor: theme.palette.surface[100],
    borderRadius: '12px 0 12px 12px',
  },
  assistantMessageCard: {
    cursor: 'pointer',
    color: theme.palette.actionV2.primary.fill,
    background: 'transparent',
    borderRadius: '0 12px 12px 12px',
    '&:hover': {
      backgroundColor: theme.palette.surface[100],
    },
  },
  selectedMessageCard: {
    backgroundColor: theme.palette.actionV2.secondary.fill,
  },
  inputContainer: {
    position: 'sticky',
    bottom: 0,
    borderTop: `1px solid ${theme.palette.components.divider}`,
    padding: theme.spacing(2, 0),
    backgroundColor: theme.palette.surface[0],
  },
  inputWrapper: {
    display: 'flex',
    gap: theme.spacing(1),
    alignItems: 'flex-end',
  },
  inputButtonWrapper: {
    paddingTop: theme.spacing(3.5),
    paddingBottom: theme.spacing(3.5),
    paddingLeft: theme.spacing(2),
    paddingRight: 0,
  },
  textField: {
    flex: 1,
    '& textarea': {
      paddingRight: theme.spacing(14),
    },
  },
  mobileSendButton: {
    minWidth: 0,
    height: 32,
    width: 32,
    padding: 4,
    borderRadius: 8,
  },
  desktopSendButton: {
    display: 'flex',
    alignItems: 'center',
  },
  stopIcon: {
    width: 12,
    height: 12,
    backgroundColor: theme.palette.states.active,
    borderRadius: 2,
    marginRight: theme.spacing(1),
    [theme.breakpoints.down('Medium')]: {
      margin: 0,
    },
  },
  chartIndicator: {
    color: theme.palette.actionV2.primaryBrand.fill,
    fontSize: '0.75rem',
    marginTop: theme.spacing(0.5),
  },
}));

export default useAIChatInterfaceStyles;
