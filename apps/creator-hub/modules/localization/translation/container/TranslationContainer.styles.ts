import { makeStyles } from '@rbx/ui';

const useTranslationContainerStyles = makeStyles()((theme) => ({
  errorTextGrid: {
    width: '100%',
    height: '100vh',
  },

  errorText: {
    marginLeft: theme.spacing(2 / 3),
  },
}));

export default useTranslationContainerStyles;
