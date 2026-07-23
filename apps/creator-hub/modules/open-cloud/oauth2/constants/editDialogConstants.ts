import EditOAuthAppFormDialogState from '../enums/EditOAuthAppFormDialogState';
import OAuthFormDialogButtonOptions from '../enums/OAuthFormDialogButtonOptions';

export interface OAuthDialogMetaData {
  title: string;
  firstPartContent: string;
  secondPartContent: string;
  confirmText: string;
  cancelText?: string;
  confirmButtonColor: OAuthFormDialogButtonOptions;
}

const editModeTranslationsMap: { [key in EditOAuthAppFormDialogState]: OAuthDialogMetaData } = {
  [EditOAuthAppFormDialogState.Regenerate]: {
    title: 'Title.OAuthRegenerate',
    confirmText: 'Label.ConfirmRegeneration',
    firstPartContent: 'Description.RegenerateDialogContent1',
    secondPartContent: 'Description.RegenerateDialogContent2',
    cancelText: 'Label.Cancel',
    confirmButtonColor: OAuthFormDialogButtonOptions.Alert,
  },
  [EditOAuthAppFormDialogState.Delete]: {
    title: 'Title.DeleteApp',
    confirmText: 'Label.ConfirmDelete',
    firstPartContent: 'Description.DeleteDialogContent1',
    secondPartContent: 'Description.DeleteDialogContent2',
    cancelText: 'Label.Cancel',
    confirmButtonColor: OAuthFormDialogButtonOptions.Alert,
  },
  [EditOAuthAppFormDialogState.InvalidEdit]: {
    title: 'Heading.InvalidChanges',
    confirmText: 'Button.ReturnToPage',
    firstPartContent: 'Message.OAuthInvalidUnsavedChanges',
    secondPartContent: 'Message.OAuthUnsavedInvalidAppMessage',
    cancelText: 'Button.ContinueAndExit',
    confirmButtonColor: OAuthFormDialogButtonOptions.Primary,
  },
  [EditOAuthAppFormDialogState.ValidEdit]: {
    title: 'Heading.SaveChanges',
    confirmText: 'Button.SaveChanges',
    firstPartContent: 'Message.OAuthValidUnsavedChanges',
    secondPartContent: 'Message.OAuthUnsavedValidAppMessage',
    cancelText: 'Button.ContinueAndExit',
    confirmButtonColor: OAuthFormDialogButtonOptions.Primary,
  },
  [EditOAuthAppFormDialogState.ValidEditInline]: {
    title: 'Heading.SaveChanges',
    confirmText: 'Button.SaveChanges',
    firstPartContent: 'Message.OAuthValidUnsavedChanges',
    secondPartContent: 'Message.OAuthUnsavedValidAppMessage',
    cancelText: 'Label.Cancel',
    confirmButtonColor: OAuthFormDialogButtonOptions.Primary,
  },
  [EditOAuthAppFormDialogState.InvalidEditInline]: {
    title: 'Heading.InvalidChanges',
    confirmText: 'Button.ReturnToPage',
    firstPartContent: 'Message.OAuthInvalidUnsavedChanges',
    secondPartContent: 'Message.OAuthUnsavedInvalidAppMessage',
    confirmButtonColor: OAuthFormDialogButtonOptions.Primary,
  },
};

export default editModeTranslationsMap;
