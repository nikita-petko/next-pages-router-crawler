import { makeStyles } from '@rbx/ui';

const useMultiDocumentUploaderStyles = makeStyles()((theme) => ({
  container: {
    width: '100%',
    border: `dashed 1px ${theme.palette.surface.outline}`,
    borderRadius: 8,
    marginBottom: 12,
  },

  uploadButtonContainer: {
    width: '100%',
  },

  errorClass: {
    padding: 12,
  },

  addMediaButton: {
    margin: 12,
  },

  fileUploadContentContainer: {
    padding: 24,
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
  },

  dragDropActive: {
    background: theme.palette.action.hover,
  },

  fileList: {
    width: '100%',
  },

  listItemText: {
    paddingRight: 12,
    paddingLeft: 12,
  },
}));

export default useMultiDocumentUploaderStyles;
