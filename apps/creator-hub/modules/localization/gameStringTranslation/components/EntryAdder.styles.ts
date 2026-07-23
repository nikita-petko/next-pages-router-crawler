import { makeStyles } from '@rbx/ui';

const useEntryAdderStyles = makeStyles()((theme) => ({
  panel: {
    marginBottom: theme.spacing(1),
  },

  text: {
    width: '100%',
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(2),
  },

  charactersRemainingText: {
    color: theme.palette.text.secondary,
  },

  exampleGrid: {
    width: '100%',
    marginTop: theme.spacing(2),
  },

  buttons: {
    marginTop: theme.spacing(2),
  },

  leftButton: {
    marginRight: theme.spacing(1),
  },

  inputField: {
    background: theme.palette.media.secondaryBackground,
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
    marginBottom: 10,
  },

  rtlInputField: {
    background: theme.palette.media.secondaryBackground,
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
    marginBottom: 10,
    direction: 'rtl',
  },
}));

export default useEntryAdderStyles;
