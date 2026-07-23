import { makeStyles } from '@rbx/ui';

const usePlaceVersionHistoryStyles = makeStyles()(() => ({
  container: {
    padding: 8,
  },

  tableContainer: {
    overflowX: 'scroll',
  },

  title: {
    marginBottom: 12,
  },

  description: {
    marginBottom: 64,
  },

  subdescription: {
    marginTop: 12,
  },

  icon: {
    marginRight: 7,
    height: 19,
  },
}));

export default usePlaceVersionHistoryStyles;
