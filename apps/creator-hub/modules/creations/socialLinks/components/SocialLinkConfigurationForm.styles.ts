import { makeStyles } from '@rbx/ui';

const useSocialLinkConfigurationFormStyles = makeStyles()(() => ({
  formField: {
    marginBottom: 48,
  },

  select: {
    width: 242,
  },

  urlField: {
    marginTop: 24,
  },

  urlFieldWithLinkTypeError: {
    marginTop: 8,
  },

  buttons: {
    marginTop: 32,
  },

  cancelButton: {
    marginRight: 12,
  },

  deleteButton: {
    paddingTop: 0,
  },

  errorMessage: {
    marginLeft: 14,
    marginRight: 14,
    marginTop: 4,
  },

  dialogText: {
    overflowWrap: 'break-word',
  },

  linkTypeErrorText: {
    marginTop: 4,
    marginLeft: 14,
    marginRight: 14,
  },
}));

export default useSocialLinkConfigurationFormStyles;
