import type { FC } from 'react';
import React from 'react';
import { makeStyles, FileCopyOutlinedIcon, IconButton } from '@rbx/ui';

const useStyles = makeStyles()((theme) => ({
  iconButtonColor: {
    color: theme.palette.states.active,
  },
}));
type CopyRawJSONButtonProps = {
  onClick: () => void;
};

const CopyRawJSONButton: FC<CopyRawJSONButtonProps> = ({ onClick }) => {
  const {
    classes: { iconButtonColor },
  } = useStyles();
  return (
    <IconButton aria-label='copy' onClick={onClick}>
      <FileCopyOutlinedIcon classes={{ root: iconButtonColor }} />
    </IconButton>
  );
};

export default CopyRawJSONButton;
