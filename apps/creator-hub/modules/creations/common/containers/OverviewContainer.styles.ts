import { makeStyles } from '@rbx/ui';

const overviewImgMaxWidth = '420px';
const overviewImgSquareMaxWidth = '300px';

const useOverviewContainerStyles = makeStyles()((theme) => ({
  overviewHeaderContainer: {
    height: `calc(100% + ${theme.spacing(2)})`,
  },

  overviewHeaderMetaData: {
    paddingTop: 8,
    paddingBottom: 16,
  },

  background: {
    padding: 12,
  },

  overviewImgSquareContainer: {
    [theme.breakpoints.up('Large')]: {
      maxWidth: overviewImgSquareMaxWidth,
    },
  },

  overviewImgContainer: {
    [theme.breakpoints.up('Large')]: {
      maxWidth: overviewImgMaxWidth,
    },
  },

  overviewImg: {
    float: 'left',
  },

  overviewActionsContainer: {
    marginTop: 20,
  },
}));

export default useOverviewContainerStyles;
