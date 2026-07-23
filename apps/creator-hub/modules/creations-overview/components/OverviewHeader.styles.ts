import { makeStyles } from '@rbx/ui';

const useOverviewHeaderStyles = makeStyles()((theme) => ({
  container: {
    minHeight: 150,
  },

  editInStudioContainer: {
    [theme.breakpoints.down('Large')]: {
      display: 'none',
    },
  },

  thumbnailContainer: {
    maxWidth: 196,
    marginRight: 24,
    [theme.breakpoints.down('Large')]: {
      display: 'none',
    },
  },

  thumbnailContainerV2: {
    maxWidth: 97,
    marginRight: 24,
    [theme.breakpoints.down('Large')]: {
      display: 'none',
    },
  },

  titleContainer: {
    marginBottom: 4,
  },

  subtitleContainer: {
    marginBottom: 4,
  },

  metadataContainer: {
    justifyContent: 'space-between',
  },

  statIcon: {
    marginRight: 4,
    verticalAlign: 'middle',
    display: 'inline-block',
  },

  stat: {
    verticalAlign: 'middle',
    display: 'inline-block',
  },
}));

export default useOverviewHeaderStyles;
