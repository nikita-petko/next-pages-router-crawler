import React, { ForwardRefRenderFunction } from 'react';
import { Button, makeStyles, Tooltip } from '@rbx/ui';

const useStyles = makeStyles()(() => ({
  buttonContainer: {
    display: 'inline-block',
  },
}));

type IconCandidateButtonProps = {
  onClick: () => void;
  label: string;
  tooltip?: string;
  startIcon?: React.ReactNode;
  disabled?: boolean;
};

const IconCandidateButton: ForwardRefRenderFunction<HTMLButtonElement, IconCandidateButtonProps> = (
  { onClick, label, tooltip, startIcon, disabled },
  ref,
) => {
  const {
    classes: { buttonContainer },
  } = useStyles();
  return (
    <Tooltip title={tooltip} arrow placement='top'>
      {/** Need to wrap Button with a <span> element because
       * Tooltip component does not work on a disabled button with pointer-event: none
       */}
      <span className={buttonContainer}>
        <Button
          ref={ref}
          variant='contained'
          color='secondary'
          disableRipple
          startIcon={startIcon}
          disabled={disabled}
          onClick={onClick}>
          {label}
        </Button>
      </span>
    </Tooltip>
  );
};

export default React.forwardRef(IconCandidateButton);
