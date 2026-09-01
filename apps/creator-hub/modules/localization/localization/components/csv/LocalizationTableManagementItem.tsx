import type { FunctionComponent, ReactNode } from 'react';
import React from 'react';
import { Button, Grid, useMediaQuery } from '@rbx/ui';
import LocalizationTableManagementItemStyles from './LocalizationTableManagementItem.styles';

export interface LocalizationTableManagementItemProps {
  buttonText: string;
  infoText: ReactNode;
  ariaLabel: string;
  isButtonDestructive: boolean;
  onClick: () => void;
}

const LocalizationTableManagementItem: FunctionComponent<
  React.PropsWithChildren<LocalizationTableManagementItemProps>
> = ({ buttonText, infoText, ariaLabel, isButtonDestructive, onClick }) => {
  const {
    classes: { list, button },
  } = LocalizationTableManagementItemStyles();
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));

  return (
    <Grid container direction='row' justifyContent='space-between'>
      <Grid XSmall={isCompactView ? 4 : 9} className={list} justifyContent='flex-start'>
        {infoText}
      </Grid>
      <Grid className={button} XSmall={3}>
        <Button
          aria-label={ariaLabel}
          size={isCompactView ? 'small' : 'medium'}
          color={isButtonDestructive ? 'destructive' : 'primary'}
          variant='contained'
          onClick={onClick}>
          {buttonText}
        </Button>
      </Grid>
    </Grid>
  );
};

export default LocalizationTableManagementItem;
