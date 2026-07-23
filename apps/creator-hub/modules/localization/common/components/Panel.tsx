import type { FunctionComponent } from 'react';
import React, { type JSX } from 'react';
import { Typography, Grid } from '@rbx/ui';
import usePanelStyles from './Panel.styles';

export interface PanelProps {
  title: string;
  className?: string;
  children?: JSX.Element | JSX.Element[];
}

const Panel: FunctionComponent<React.PropsWithChildren<PanelProps>> = ({
  className,
  title,
  children,
}) => {
  const {
    classes: { panel },
  } = usePanelStyles();
  return (
    <Grid className={className}>
      <Typography variant='subtitle2' className={panel}>
        {title}
      </Typography>
      {children}
    </Grid>
  );
};

export default Panel;
