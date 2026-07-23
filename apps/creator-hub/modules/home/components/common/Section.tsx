import React, { FunctionComponent } from 'react';
import { makeStyles } from '@rbx/ui';

const useStyles = makeStyles()((theme) => ({
  section: {
    marginBottom: 48,
    [theme.breakpoints.down('Large')]: {
      marginBottom: 24,
    },
  },
}));

type TSectionProps = {
  classes?: Partial<{ root: string }>;
};

const Section: FunctionComponent<React.PropsWithChildren<TSectionProps>> = ({
  classes,
  children,
}) => {
  const {
    classes: { section },
    cx,
  } = useStyles();
  return <div className={cx(section, classes?.root)}>{children}</div>;
};

export default Section;
