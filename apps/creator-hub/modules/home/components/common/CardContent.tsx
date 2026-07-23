import React, { FunctionComponent } from 'react';
import { makeStyles } from '@rbx/ui';

const useStyles = makeStyles()({
  root: {
    padding: 12,
  },
});

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
