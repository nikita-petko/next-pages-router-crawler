import { makeStyles } from '@rbx/ui';

const useSingleLevelOperationsFormStyles = makeStyles()(() => ({
  copyTargetPartButton: {
    paddingLeft: 8,
  },

  targetValueHeader: {
    padding: 12,
    marginTop: 16,
    marginBottom: 16,
  },

  experienceNameListItem: {
    margin: 5,
    paddingLeft: 20,
  },
}));

export default useSingleLevelOperationsFormStyles;
