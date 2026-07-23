import { makeStyles } from '@rbx/ui';

const useCreateApiKeyFormStyles = makeStyles()(() => ({
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

export default useCreateApiKeyFormStyles;
