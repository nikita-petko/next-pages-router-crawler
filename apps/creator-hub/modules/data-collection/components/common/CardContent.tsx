import type { FunctionComponent } from 'react';
import React from 'react';
import { makeStyles } from '@rbx/ui';

const useStyles = makeStyles()((theme) => ({
  root: {
    padding: 60,
    [theme.breakpoints.down('Large')]: {
      padding: 20,
    },
  },
}));

type TCardContentProps = {
  classes?: Partial<{ root: string }>;
};

export const CardContent: FunctionComponent<React.PropsWithChildren<TCardContentProps>> = ({
  classes,
  children,
}) => {
  const {
    classes: { root },

    cx,
  } = useStyles();
  return <div className={cx(root, classes?.root)}>{children}</div>;
};

export default CardContent;
