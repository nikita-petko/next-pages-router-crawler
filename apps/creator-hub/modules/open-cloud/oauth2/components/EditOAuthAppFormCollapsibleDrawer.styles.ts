import { makeStyles } from '@rbx/ui';

const useEditOAuthAppFormCollapsibleDrawerStyles = makeStyles()(() => ({
  drawer: {
    marginTop: 40,
  },

  label: {
    marginRight: 16,
    textAlign: 'left',
    fontWeight: 'bold',
  },

  labelContainer: {
    minWidth: 125, // align with InlineCodeRowContent
  },

  rowContainer: {
    marginBottom: 16,
  },
}));

export default useEditOAuthAppFormCollapsibleDrawerStyles;
