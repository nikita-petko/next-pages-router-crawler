import { makeStyles } from '@rbx/ui';

const PREVIEW_COLUMN_MAX_WIDTH = 340;

const useConfigureMediaFiatFormStyles = makeStyles()((theme) => ({
  accessCardStyle: {
    margin: '12px 24px',
    marginRight: 0,
  },

  button: {
    marginRight: 12,
  },

  buttonContainer: {
    padding: '32px 0',
  },

  divider: {
    marginBottom: 48,
    marginTop: 48,
  },

  errorMessageContainer: {
    color: theme.palette.actionV2.important.fill,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
    paddingLeft: 14,
    paddingRight: 14,
    width: '100%',
    whiteSpace: 'break-spaces',
  },

  imageUploaderContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    paddingTop: 16,
    '& button': {
      textTransform: 'none',
    },
  },

  helperTextStyle: {
    paddingLeft: 36,
  },

  pageContainer: {
    gridGap: 40,
    [theme.breakpoints.down('Large')]: {
      paddingLeft: 12,
      paddingRight: 12,
    },
  },

  radioLabel: {
    paddingRight: 4,
  },

  radioStyle: {
    paddingLeft: 9,
  },

  subtitleContainer: {
    paddingBottom: theme.spacing(0.5),
  },

  moderationAlertContainer: {
    marginBottom: 16,
  },

  descriptionModerationAlert: {
    marginBottom: 16,
    width: '100%',
  },

  discoverabilityContainer: {
    marginTop: 24,
  },

  moderationErrorIcon: {
    alignItems: 'center',
    backgroundColor: theme.palette.actionV2.important.fill,
    borderRadius: '50%',
    display: 'inline-flex',
    fontSize: 'inherit',
    height: '1em',
    justifyContent: 'center',
    width: '1em',
    '& svg': {
      color: theme.palette.common.white,
      fontSize: '0.7em',
    },
  },

  formAndPreviewContainer: {
    rowGap: 0,
    columnGap: 0,
  },

  previewColumn: {
    maxWidth: PREVIEW_COLUMN_MAX_WIDTH,
    paddingLeft: 24,
    [theme.breakpoints.down('Large')]: {
      maxWidth: '100%',
      paddingLeft: 0,
      paddingTop: 24,
    },
  },

  previewHeader: {
    alignItems: 'center',
    display: 'flex',
    gap: 6,
    marginBottom: 8,
  },
}));

export default useConfigureMediaFiatFormStyles;
