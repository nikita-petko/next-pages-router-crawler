import { makeStyles } from '@rbx/ui';

const useEditOAuthAppFormHeaderStyles = makeStyles()(() => ({
  header: {
    margin: `16px 0px`,
  },

  footerButton: {
    marginRight: `8px`,
  },

  detailButton: {
    marginLeft: '8px',
  },

  label: {
    paddingRight: '8px',
  },

  headerLeft: {
    display: 'flex',
    alignItems: 'center',
  },

  appName: {
    whiteSpace: 'nowrap',
    maxWidth: 500,
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
}));

export default useEditOAuthAppFormHeaderStyles;
