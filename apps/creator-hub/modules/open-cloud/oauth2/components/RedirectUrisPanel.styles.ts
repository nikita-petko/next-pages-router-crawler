import { makeStyles } from '@rbx/ui';

const useRedirectUrisPanelStyles = makeStyles()(() => ({
  body: {
    paddingTop: 8,
    paddingBottom: 4,
  },

  textfield: {
    width: 750,
    margin: '16px 0px',
  },

  addUriButton: {
    margin: '16px 0px',
    padding: '4px 32px',
  },

  deleteIcon: {
    marginBottom: 36,
  },
}));

export default useRedirectUrisPanelStyles;
