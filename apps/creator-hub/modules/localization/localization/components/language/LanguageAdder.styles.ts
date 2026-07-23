import { makeStyles } from '@rbx/ui';

const useLanguageAdderStyles = makeStyles()((theme) => ({
  grid: {
    marginTop: theme.spacing(2),
  },

  placeholder: {
    marginTop: theme.spacing(1),
    opacity: 0,
  },

  successText: {
    color: theme.palette.success.main,
  },

  notSupportedText: {
    color: theme.palette.text.secondary,
  },
}));

export default useLanguageAdderStyles;
