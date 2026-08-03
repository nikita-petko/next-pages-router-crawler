enum CreateDialogMode {
  ExitPageOnDirty, // unsaved key warning
  ExitPagePostCreateOnDirtyValid, // exit page on dirty post create (i.e. partial edit mode/create) = Discard changes prompt, but for valid changes
  ExitPagePostCreateOnDirtyInvalid, // exit page on dirty post create (i.e. partial edit mode/create) = Discard changes prompt, but for invalid changes
}

export default CreateDialogMode;
