import { makeStyles } from '@rbx/ui';

const useCreateAssetFormStyles = makeStyles()((theme) => ({
  createAssetInfoText: {
    marginTop: 16,
  },

  createButton: {
    marginLeft: 12,
    marginRight: 12,
  },

  pageContainer: {
    width: '100%',
    height: '100%',
    minHeight: 450,
  },

  formContainer: {
    flexDirection: 'column',
    width: '100%',
    [theme.breakpoints.down('Medium')]: {
      paddingLeft: 12,
      paddingRight: 12,
    },
  },

  formLinks: {
    paddingTop: 17,
  },

  formHeading: {
    paddingBottom: 48,
  },

  inputFormPadding: {
    flexDirection: 'column',
    width: '100%',
  },

  inputFormElement: {
    paddingBottom: 32,
  },

  SelectionArea: {
    flexGrow: 1,
    paddingBottom: 48,
  },

  assetUploaderContainer: {
    paddingBottom: 48,
  },

  errorMessageStyles: {
    width: '100%',
    marginTop: 4,
    paddingLeft: 14,
    paddingRight: 14,
    color: theme.palette.error.main,
    fontWeight: 'bold',
    fontSize: 12,
  },

  AssetTypeSelection: {
    minWidth: '320px',
  },

  buttonContainer: {
    padding: '32px 0',
    flexDirection: 'row',
    [theme.breakpoints.down('Large')]: {
      flexDirection: 'column',
    },
  },
}));

export default useCreateAssetFormStyles;
