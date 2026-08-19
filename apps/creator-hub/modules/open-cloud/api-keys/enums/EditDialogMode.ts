enum EditDialogMode {
  RegenerateWhenOwner, // regenerate key dialog prompt when the last generated user matches the current user
  RegenerateWhenNotOwner, // regenerate key dialog prompt when the last generated user does not match current user
  Delete, // delete key dialog prompt
  Enable, // enable key dialog prompt
  Disable, // disable key dialog prompt
  ExitPageOnDirtyInvalid, // discard and close (edit) when the form is invalid
  ExitPageOnDirtyValid, // discard and close (edit) when the form is valid
}

export default EditDialogMode;
