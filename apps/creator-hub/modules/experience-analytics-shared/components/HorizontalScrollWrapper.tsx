import React, { FunctionComponent, ReactNode } from 'react';
import { Grid } from '@rbx/ui';
import useHorizontalScrollWrapperStyles from './HorizontalScrollWrapper.styles';

export interface HorizontalScrollWrapperProps {
  children: ReactNode;
}

const HorizontalScrollWrapper: FunctionComponent<HorizontalScrollWrapperProps> = ({ children }) => {
  const {
    classes: { horizontalScrollContainer, horizontalScrollWrapper },
  } = useHorizontalScrollWrapperStyles();
  return (
    <Grid item className={horizontalScrollContainer}>
      <div className={horizontalScrollWrapper}>{children}</div>
    </Grid>
  );
};

export default HorizontalScrollWrapper;
