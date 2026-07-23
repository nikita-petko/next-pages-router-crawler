import { makeStyles } from '@rbx/ui';

const useUploadVideoPreviewsFormStyles = makeStyles()((theme) => ({
  fileNameContainer: {
    marginTop: theme.spacing(1),
    fontWeight: 500,
  },

  videoPlayerContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: theme.spacing(0.5),
    overflow: 'hidden',
  },

  moderationStatusBox: {
    width: '100%',
    maxWidth: 400,
    aspectRatio: '16/9',
    backgroundColor: theme.palette.surface[100],
    borderRadius: theme.spacing(0.5),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(2),
    textAlign: 'center',
  },

  moderationStatusMessage: {
    marginTop: theme.spacing(1),
  },

  moderationStatusIcon: {
    fontSize: 48,
  },

  rejectedMessagesContainer: {
    marginTop: theme.spacing(0.5),
  },

  requirementInfoItem: {
    display: 'block',
    marginBottom: theme.spacing(1),
  },

  headerTitle: {
    marginBottom: theme.spacing(1),
  },

  headerDescription: {
    marginBottom: theme.spacing(1),
  },

  controlsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  },

  mainContentContainer: {
    maxWidth: 720,
  },

  removeButton: {
    width: '100%',
    maxWidth: 200,
  },

  videoInfoContainer: {
    marginTop: theme.spacing(2),
  },

  approvedStatusMessage: {
    display: 'block',
    marginBottom: theme.spacing(1),
  },

  uploadButton: {
    marginBottom: theme.spacing(2),
  },

  errorMessage: {
    minHeight: 'auto',
    visibility: 'visible',
    marginTop: theme.spacing(0.5),
    marginBottom: theme.spacing(0.5),
  },

  errorMessageHidden: {
    minHeight: 12,
    visibility: 'hidden',
    marginTop: theme.spacing(0.5),
    marginBottom: theme.spacing(0.5),
  },
}));

export default useUploadVideoPreviewsFormStyles;
