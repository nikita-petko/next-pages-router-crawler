import React, { FunctionComponent } from 'react';
import { CheckIcon, CloseIcon, Grid, LockIcon, LockOpenIcon, makeStyles } from '@rbx/ui';

export type IconWithLabelProps = {
  iconType: IconType;
  label: string;
};

export enum IconType {
  Check,
  Close,
  Lock,
  LockOpen,
}

const useIconWithLabelStyles = makeStyles()(() => ({
  iconLabel: {
    paddingLeft: '8px',
  },
}));

const IconWithLabel: FunctionComponent<React.PropsWithChildren<IconWithLabelProps>> = ({
  iconType,
  label,
}) => {
  const {
    classes: { iconLabel },
  } = useIconWithLabelStyles();

  let iconElement;
  switch (iconType) {
    case IconType.Check:
      iconElement = <CheckIcon />;
      break;
    case IconType.Close:
      iconElement = <CloseIcon />;
      break;
    case IconType.Lock:
      iconElement = <LockIcon />;
      break;
    case IconType.LockOpen:
      iconElement = <LockOpenIcon />;
      break;
    default:
      iconElement = <CheckIcon />;
  }

  return (
    <Grid container>
      <Grid item>{iconElement}</Grid>
      <Grid item className={iconLabel}>
        {label}
      </Grid>
    </Grid>
  );
};

export default IconWithLabel;
