import { makeStyles } from '@rbx/ui';

const useEditApiKeyFormStyles = makeStyles()((theme) => ({
  topFormBlock: {
    marginBottom: 32,
  },

  controlsBlock: {
    padding: '8px 0px 8px 0px',
  },

  deleteBtn: {
    marginTop: 16,
    backgroundColor: theme.palette.actionV2.important.fill,
  },

  deleteBtnWrapper: {
    float: 'right',
  },

  bottomActionBtns: {
    marginTop: 16,
  },

  lowerSaveBtn: {
    marginRight: 8,
  },

  learnMoreLink: {
    fontSize: '14px',
    color: 'white',
    alignSelf: 'flex-start',
    marginTop: '1px',
    whiteSpace: 'nowrap',
  },
}));

export default useEditApiKeyFormStyles;
