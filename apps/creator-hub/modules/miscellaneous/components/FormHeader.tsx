import type { FunctionComponent } from 'react';
import React from 'react';
import { Divider, Typography, IconButton, CloseIcon, CheckIcon, Grid } from '@rbx/ui';
import useFormHeaderStyles from './FormHeader.styles';
import ToolTipButton from './TooltipButton';

export interface FormHeaderProps {
  compact: boolean; // media query setting for compact vs desktop view
  submitBtnMsg: string; // submit head button text content
  canSubmit: boolean; // determines whether header submit button is disabled
  title: string;
  tooltipOnDisableMsg?: string;
  onClose?: () => void; // callback called when disableDialogOnClose is true
  onSubmit?: () => void;
}

const FormHeader: FunctionComponent<React.PropsWithChildren<FormHeaderProps>> = ({
  compact,
  submitBtnMsg,
  canSubmit,
  title,
  tooltipOnDisableMsg,
  onClose,
  onSubmit,
}) => {
  const {
    classes: { header },
  } = useFormHeaderStyles();

  return (
    <>
      <Grid container className={header} justifyContent='space-between' alignItems='center'>
        <IconButton aria-label='cancel' color='secondary' onClick={onClose} size='large'>
          <CloseIcon />
        </IconButton>

        <Typography variant='h3'>{title}</Typography>

        {compact ? (
          <IconButton aria-label='submit' disabled={!canSubmit} onClick={onSubmit} size='large'>
            <CheckIcon />
          </IconButton>
        ) : (
          <ToolTipButton
            disabled={!canSubmit}
            btnMsg={submitBtnMsg}
            tooltipOnDisableMsg={tooltipOnDisableMsg}
            onClick={onSubmit}
          />
        )}
      </Grid>
      <Divider />
    </>
  );
};

export default FormHeader;
