import { makeStyles } from '@rbx/ui';

const useLanguageSelectorStyles = makeStyles()((theme) => ({
  grid: {
    marginTop: theme.spacing(2),
  },

  select: {
    width: '100%',
  },

  error: {
    marginTop: theme.spacing(1),
  },
}));

export default useLanguageSelectorStyles;
