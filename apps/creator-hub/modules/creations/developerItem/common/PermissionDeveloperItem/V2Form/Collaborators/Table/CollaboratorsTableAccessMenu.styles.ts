import { makeStyles } from '@rbx/ui';

const useCollaboratorsTableAccessMenuStyles = makeStyles()((theme) => ({
  dialog: {
    padding: 4,
  },
  divider: {
    margin: 0,
    padding: 0,
  },
  removeText: {
    color: theme.palette.content.alert.important,
  },
}));

export default useCollaboratorsTableAccessMenuStyles;
