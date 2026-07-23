import { makeStyles } from '@rbx/ui';

const quotaSkeletonWidthByDesign = 600;
const quotaSkeletonHeightByDesign = 72;
const dateSkeletonWidthByDesign = 240;

const useContainerStyles = makeStyles()((theme) => ({
  anchor: {
    paddingLeft: theme.spacing(2 / 3),
    outline: 'none',
    color: theme.palette.text.primary,
  },

  gridContainer: {
    paddingBottom: theme.spacing(1),
    flexWrap: 'nowrap',
    [theme.breakpoints.down('Large')]: {
      flexWrap: 'wrap',
    },
  },

  quotaSkeleton: {
    width: `${quotaSkeletonWidthByDesign}px`,
    height: `${quotaSkeletonHeightByDesign}px`,
    marginRight: theme.spacing(1),
    marginTop: `-${theme.spacing(4 / 3)}`,
    marginBottom: `-${theme.spacing(4 / 3)}`,
    [theme.breakpoints.down('Large')]: {
      marginBottom: 0,
    },
  },

  dateSkeleton: {
    width: `${dateSkeletonWidthByDesign}px`,
    [theme.breakpoints.down('Large')]: {
      marginTop: `-${-theme.spacing(4 / 3)}`,
    },
  },

  errorText: {
    paddingLeft: `-${theme.spacing(2 / 3)}`,
    color: theme.palette.error.main,
  },

  renewalDateText: {
    color: theme.palette.text.secondary,
  },
}));

export default useContainerStyles;
