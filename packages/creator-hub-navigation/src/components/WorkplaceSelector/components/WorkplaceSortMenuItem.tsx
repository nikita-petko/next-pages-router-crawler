import React from 'react';
import { CheckIcon, makeStyles, MenuItem } from '@rbx/ui';
import { TSorts } from '../../../providers/WorkspaceProvider/constants';

const useStyles = makeStyles()(() => ({
  root: {
    display: 'flex',
    justifyContent: 'space-between',
  },
}));
type TWorkspaceMenuItemProps = {
  value: TSorts;
  selected: boolean;
  onSelect: (sort: TSorts) => void;
};

const WorkspaceMenuItem: React.FunctionComponent<
  React.PropsWithChildren<TWorkspaceMenuItemProps>
> = ({ value, selected, onSelect, children }) => {
  const { classes } = useStyles();
  return (
    <MenuItem classes={classes} selected={selected} onClick={() => onSelect(value)}>
      {children}
      {selected && <CheckIcon />}
    </MenuItem>
  );
};
export default WorkspaceMenuItem;
