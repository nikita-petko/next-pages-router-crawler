import type { FunctionComponent } from 'react';
import React from 'react';
import { Typography } from '@rbx/ui';
import useOverviewIsActiveLabelStyles from './OverviewIsActiveLabel.styles';

export interface OverviewIsActiveLabelProps {
  isActive: boolean;
  activeMessage: string;
  inactiveMessage: string;
}

const OverviewIsActiveLabel: FunctionComponent<
  React.PropsWithChildren<OverviewIsActiveLabelProps>
> = ({ isActive, activeMessage, inactiveMessage }) => {
  const {
    classes: { overviewLabel },
  } = useOverviewIsActiveLabelStyles();

  return (
    <Typography className={overviewLabel} variant='h6' color={isActive ? 'success' : 'secondary'}>
      {isActive ? activeMessage : inactiveMessage}
    </Typography>
  );
};

export default OverviewIsActiveLabel;
