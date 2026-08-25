import CreateDialogMode from '../enums/CreateDialogMode';
import EditDialogMode from '../enums/EditDialogMode';

export interface DialogTitleMetadata {
  titleKey: string;
  modeKey?: string; // needed to customize Dialog Titles for Edit
}

export interface DialogControlsMetadata {
  titleKeys: DialogTitleMetadata;
  confirmBtnKey: string;
  cancelBtnKey: string;
  firstContentKey: string;
  secondContentKey?: string; // only some dialog bodies have a second paragraph
}

/**
 * Store a map of all the translation keys needed for the dialog in create form
 */
const createModeTranslationsMap: { [key in CreateDialogMode]: DialogControlsMetadata } = {
  [CreateDialogMode.ExitPageOnDirty]: {
    titleKeys: { titleKey: 'Heading.UnsavedKeyWarning' },
    confirmBtnKey: 'Button.ReturnToPage',
    cancelBtnKey: 'Button.ContinueAndExit',
    firstContentKey: 'Message.UnsavedInformation',
    secondContentKey: 'Message.DiscardChangesPrompt',
  },
  [CreateDialogMode.ExitPagePostCreateOnDirtyInvalid]: {
    titleKeys: { titleKey: 'Heading.InvalidChanges' },
    confirmBtnKey: 'Button.ReturnToPage',
    cancelBtnKey: 'Button.ContinueAndExit',
    firstContentKey: 'Message.InvalidUnsavedChanges',
    secondContentKey: 'Message.UnsavedInvalidKeyMessage',
  },
  [CreateDialogMode.ExitPagePostCreateOnDirtyValid]: {
    titleKeys: { titleKey: 'Heading.SaveChanges' },
    confirmBtnKey: 'Button.SaveChanges',
    cancelBtnKey: 'Button.ContinueAndExit',
    firstContentKey: 'Message.ValidUnsavedChanges',
    secondContentKey: 'Message.UnsavedValidKeyMessage',
  },
};

/**
 * Store a map of all the translation keys needed for the dialog in edit form
 */
const editModeTranslationMap: { [key in EditDialogMode]: DialogControlsMetadata } = {
  [EditDialogMode.RegenerateWhenNotOwner]: {
    titleKeys: { titleKey: 'Heading.ConfirmKeyDialogMode', modeKey: 'Message.ModeRegenerate' },
    confirmBtnKey: 'Button.Continue',
    cancelBtnKey: 'Action.Cancel',
    firstContentKey: 'Message.ConfirmKeyRegenerateWhenNotOwner',
    secondContentKey: 'Message.SavedSeparateWarning',
  },
  [EditDialogMode.RegenerateWhenOwner]: {
    titleKeys: { titleKey: 'Heading.ConfirmKeyDialogMode', modeKey: 'Message.ModeRegenerate' },
    confirmBtnKey: 'Button.Continue',
    cancelBtnKey: 'Action.Cancel',
    firstContentKey: 'Message.ConfirmKeyRegenerate',
    secondContentKey: 'Message.SavedSeparateWarning',
  },
  [EditDialogMode.Disable]: {
    titleKeys: { titleKey: 'Heading.ConfirmKeyDialogMode', modeKey: 'Message.ModeDisable' },
    confirmBtnKey: 'Button.Continue',
    cancelBtnKey: 'Action.Cancel',
    firstContentKey: 'Message.ImmediateEffectWarning',
    secondContentKey: 'Message.ConfirmKeyDisable',
  },
  [EditDialogMode.Enable]: {
    titleKeys: { titleKey: 'Heading.ConfirmKeyDialogMode', modeKey: 'Message.ModeEnable' },
    confirmBtnKey: 'Button.Continue',
    cancelBtnKey: 'Action.Cancel',
    firstContentKey: 'Message.ImmediateEffectWarning',
    secondContentKey: 'Message.ConfirmKeyEnable',
  },
  [EditDialogMode.Delete]: {
    titleKeys: { titleKey: 'Heading.ConfirmKeyDialogMode', modeKey: 'Message.ModeDelete' },
    confirmBtnKey: 'Action.Delete',
    cancelBtnKey: 'Action.Cancel',
    firstContentKey: 'Message.ConfirmKeyDelete',
  },
  [EditDialogMode.ExitPageOnDirtyInvalid]: {
    titleKeys: { titleKey: 'Heading.InvalidChanges' },
    confirmBtnKey: 'Button.ReturnToPage',
    cancelBtnKey: 'Button.ContinueAndExit',
    firstContentKey: 'Message.InvalidUnsavedChanges',
    secondContentKey: 'Message.UnsavedInvalidKeyMessage',
  },
  [EditDialogMode.ExitPageOnDirtyValid]: {
    titleKeys: { titleKey: 'Heading.SaveChanges' },
    confirmBtnKey: 'Button.SaveChanges',
    cancelBtnKey: 'Button.ContinueAndExit',
    firstContentKey: 'Message.ValidUnsavedChanges',
    secondContentKey: 'Message.UnsavedValidKeyMessage',
  },
};

export { createModeTranslationsMap, editModeTranslationMap };
