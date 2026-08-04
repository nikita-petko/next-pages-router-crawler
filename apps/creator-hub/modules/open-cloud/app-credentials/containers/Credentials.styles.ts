import { makeStyles } from '@rbx/ui';

const fullWidthHeight = {
  width: '100%',
  height: '100%',
};

const useCredentialStyles = makeStyles()(() => ({
  learnMoreLink: {
    fontSize: '14px',
    color: 'white',
    alignSelf: 'flex-start',
    marginTop: '1px',
    whiteSpace: 'nowrap',
  },
  section: {
    ...fullWidthHeight,
    margin: `8px 0px`,
    paddingBottom: 40,
  },

  header: {
    marginBottom: 6,
  },

  groupApiKeyInfoBanner: {
    marginBottom: 24,
  },
}));

export default useCredentialStyles;
