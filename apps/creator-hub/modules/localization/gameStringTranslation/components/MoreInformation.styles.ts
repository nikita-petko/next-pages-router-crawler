import { makeStyles } from '@rbx/ui';

const useMoreInformationStyles = makeStyles()((theme) => ({
  container: {
    padding: theme.spacing(2, 0, 2, 0),
  },

  title: {
    marginRight: theme.spacing(1),
  },

  margins: {
    marginTop: 10,
    padding: theme.spacing(1, 0),
  },

  text: {
    color: theme.palette.text.secondary,
    overflowWrap: 'anywhere',
  },
}));

export default useMoreInformationStyles;
