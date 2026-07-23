import { makeStyles } from '@rbx/ui';

const useQuotaStyles = makeStyles()((theme) => ({
  gridContainer: {
    backgroundColor: theme.palette.media.secondaryBackground,
    height: 75,
    paddingLeft: 15,
    marginRight: 10,
    marginTop: 10,
    marginBottom: 2,
    borderRadius: `${2 * theme.shape.borderRadius}px`,
  },

  loader: {
    zIndex: 1,
  },

  percent: {
    marginLeft: -30,
    marginRight: 15,
    zIndex: 2,
  },

  bodyText: {
    marginTop: 5,
    paddingLeft: theme.spacing(2 / 3),
  },

  quotaType: {
    color: theme.palette.text.secondary,
  },

  ratioText: {
    color: theme.palette.text.primary,
  },
}));

export default useQuotaStyles;
