import { makeStyles } from '@rbx/ui';

const useSocialLinksFormShardStyles = makeStyles()(() => ({
  header: {
    marginBottom: 24,
  },

  removeButton: {
    position: 'relative',
    top: 8,
    marginLeft: 4,
  },

  subheader: {
    paddingTop: 4,
  },
}));

export default useSocialLinksFormShardStyles;
