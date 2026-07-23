import type { FunctionComponent } from 'react';
import React from 'react';
import { Typography } from '@rbx/ui';
import useOverviewItemTitleLabelStyles from './OverviewItemTitleLabel.styles';

export interface OverviewItemTitleLabelProps {
  itemName: string;
}

const OverviewItemTitleLabel: FunctionComponent<
  React.PropsWithChildren<OverviewItemTitleLabelProps>
> = ({ itemName }) => {
  const {
    classes: { overviewTitle },
  } = useOverviewItemTitleLabelStyles();

  return (
    <Typography variant='h2' className={overviewTitle}>
      {itemName}
    </Typography>
  );
};

export default OverviewItemTitleLabel;
