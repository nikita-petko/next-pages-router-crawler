import { makeStyles } from '@rbx/ui';

const useCreativeUploadDragonAndDropZoneStyles = makeStyles()((theme) => ({
  circularProgress: {
    height: 'fit-content',
  },

  configureAdRow: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '12px',
    width: '100%',
  },

  customHelperText: {
    marginTop: '8px !important',
  },

  dragActiveBackground: {
    backgroundColor: theme.palette.foreground.main,
  },

  dragErrorBorder: {
    borderColor: theme.palette.components.input.outlined.errorBorder,
  },

  fileUploadIcon: {
    marginRight: '8px',
  },

  hidden: {
    display: 'none',
    visibility: 'hidden',
  },

  progressContainer: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },

  uploadContainer: {
    alignContent: 'flex-start',
    alignItems: 'center',
    borderColor: theme.palette.surface.outline,
    borderRadius: '8px',
    borderStyle: 'dashed',
    borderWidth: '1px',
    display: 'flex',
    flexWrap: 'wrap',
    height: '184px',
    justifyContent: 'center',
    marginTop: '24px',
    width: '100%',
  },

  uploadErrorText: {
    position: 'relative',
    top: '4px',
  },

  uploadHelperText: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
    margin: '4px 16px',
    textAlign: 'center',
    width: '100%',
  },

  uploadMediaButton: {
    color: theme.palette.content.static.light,
    marginTop: '36px',
  },
}));

export default useCreativeUploadDragonAndDropZoneStyles;
