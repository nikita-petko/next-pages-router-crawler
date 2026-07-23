import React, { FunctionComponent } from 'react';
import { makeStyles, Skeleton } from '@rbx/ui';
import { Card } from './Card';

const useStyles = makeStyles()((theme) => ({
  root: {
    backgroundColor: theme.palette.surface[200],
  },
  skeleton: {
    height: '100%',
    width: '100%',
  },
}));

type TLoadingCardProps = {
  classes?: Partial<{ root: string }>;
};

export const LoadingCard: FunctionComponent<React.PropsWithChildren<TLoadingCardProps>> = ({
  classes,
}) => {
  const {
    classes: { root, skeleton },

    cx,
  } = useStyles();
  return (
    <Card classes={{ root: cx(root, classes?.root) }}>
      <Skeleton animate variant='rectangular' classes={{ root: skeleton }} />
    </Card>
  );
};

export default LoadingCard;
