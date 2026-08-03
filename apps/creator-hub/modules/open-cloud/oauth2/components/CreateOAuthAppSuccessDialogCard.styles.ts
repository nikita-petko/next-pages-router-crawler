import { makeStyles } from '@rbx/ui';

const useCreateFormSuccessDialogStyles = makeStyles()(() => ({
  iconButton: {
    marginBottom: -4,
    marginLeft: 4,
  },

  dialogImage: {
    display: 'block',
    margin: 'auto',
  },

  dialogButton: {
    marginLeft: 73, // values from Figma
    marginRight: 73,
  },

  firstDialogTextContent: {
    marginTop: 48,
    marginBottom: 48,
    textAlign: 'center',
  },

  dialogLinkContent: {
    textAlign: 'center',
    marginTop: 48, // value from Figma
  },

  loadingButton: {
    position: 'absolute',
  },

  inlineContent: {
    paddingLeft: 96,
  },

  warningLabel: {
    marginTop: 36,
  },
}));

export default useCreateFormSuccessDialogStyles;
