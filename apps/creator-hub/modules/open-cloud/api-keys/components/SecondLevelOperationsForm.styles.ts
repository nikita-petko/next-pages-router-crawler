import { makeStyles } from '@rbx/ui';

const useSecondLevelOperationsFormStyles = makeStyles()((theme) => ({
  spacing: {
    marginTop: 16,
    marginBottom: 16,
  },

  formBody: {
    marginTop: 8,
    marginBottom: 8,
  },

  formLabelHeading: {
    marginBottom: 8,
  },

  targetValueLabel: {
    paddingRight: 8,
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    [theme.breakpoints.down('Large')]: {
      marginBottom: 8,
    },
  },

  loader: {
    marginRight: 8,
  },

  errorBtn: {
    marginTop: 8,
  },

  addMoreBtn: {
    marginTop: 8,
    marginBottom: 8,
  },

  addMoreBtnInnerSpan: {
    marginLeft: 8,
  },
}));

export default useSecondLevelOperationsFormStyles;
