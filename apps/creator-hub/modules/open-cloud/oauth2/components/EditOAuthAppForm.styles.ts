import { makeStyles } from '@rbx/ui';

const useEditOAuthAppFormStyles = makeStyles()(() => ({
  divider: {
    marginTop: '24px',
    marginBottom: '24px',
  },

  blankSection: {
    width: '100%',
    height: '100%',
  },

  publishStatusAlert: {
    marginBottom: 20,
  },
}));

export default useEditOAuthAppFormStyles;
