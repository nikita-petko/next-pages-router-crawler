import { makeStyles } from '@rbx/ui';

const useSorterAndFilterStyles = makeStyles()((theme) => ({
  spacing: {
    justifyContent: 'space-between',
  },

  header: {
    marginTop: 15,
    marginBottom: 5,
    color: theme.palette.text.secondary,
  },

  container: {
    paddingRight: 15,
    paddingBottom: 5,
    paddingLeft: 20,
  },

  radioGroup: {
    marginLeft: -15,
  },

  radioButtons: {
    marginTop: -10,
    marginRight: 5,
  },

  buttonContainer: {
    marginTop: 15,
    marginRight: 10,
    marginLeft: 5,
  },

  tooltipContainer: {
    marginTop: 13,
    marginBottom: 5,
  },

  tooltip: {
    padding: 1,
    marginLeft: 5,
    marginBottom: -5,
    color: theme.palette.text.secondary,
  },
}));

export default useSorterAndFilterStyles;
