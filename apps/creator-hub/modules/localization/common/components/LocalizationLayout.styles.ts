import { makeStyles } from '@rbx/ui';

const bodyMaxWidthByDesign = 1200;

const useLocalizationLayoutStyles = makeStyles()((theme) => ({
  body: {
    maxWidth: `${bodyMaxWidthByDesign}px`,
  },

  title: {
    marginBottom: theme.spacing(1),
  },

  divider: {
    marginBottom: theme.spacing(2),
  },

  hidden: {
    display: 'none',
  },

  container: {
    width: '40%',
  },
}));

export default useLocalizationLayoutStyles;
