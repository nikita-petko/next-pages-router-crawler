import { makeStyles } from '@rbx/ui';

const useImageTranslationFeedbackDialogStyles = makeStyles()((theme) => ({
  dialogPaper: {
    display: 'flex',
    borderRadius: 12,
    backgroundColor: theme.palette.surface[100],
    maxWidth: 540,
    width: '100%',
    border: `1px solid ${theme.palette.surface.outline}`,
  },

  dialogPaperWide: {
    display: 'flex',
    maxWidth: 540,
    width: '100%',
  },

  titleBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    boxSizing: 'border-box',
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(0),
    marginBottom: theme.spacing(1.5),
  },

  divider: {
    marginTop: theme.spacing(2),
  },

  footer: {
    padding: theme.spacing(2),
    gap: theme.spacing(1),
    justifyContent: 'flex-end',
  },

  feedbackSection: {
    marginTop: theme.spacing(3),
    border: 'none',
    padding: 0,
    marginLeft: 0,
    marginRight: 0,
    marginBottom: 0,
    minWidth: 0,
  },

  problemPrompt: {
    marginBottom: theme.spacing(3),
  },

  requiredMark: {
    marginLeft: theme.spacing(0.5),
    color: theme.palette.content.alert.important,
  },

  radioList: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: theme.spacing(2),
  },

  radioRow: {
    marginLeft: theme.spacing(0),
    marginBottom: theme.spacing(2),
  },

  radio: {
    padding: theme.spacing(0),
    paddingRight: theme.spacing(1),
    color: theme.palette.content.disabled,
    '&:hover': {
      color: theme.palette.content.standard,
      backgroundColor: 'transparent',
    },
  },

  detailsHeading: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(1.5),
    fontWeight: theme.typography.fontWeightBold,
  },

  detailsInput: {
    borderRadius: 8,
    border: `1px solid ${theme.palette.surface.outline}`,
    width: '100%',
    marginTop: theme.spacing(0.5),
    padding: theme.spacing(1.5),
    backgroundColor: theme.palette.surface[200],
  },
}));

export default useImageTranslationFeedbackDialogStyles;
