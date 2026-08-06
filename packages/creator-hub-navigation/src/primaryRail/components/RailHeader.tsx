import React from 'react';
import { Button, Typography } from '@rbx/ui';
import useRailStyles from './Rail.styles';

type TRailHeaderProps = {
  icon: React.ReactNode;
  href: string;
  label: string;
  compact: boolean;
  enableAnimation?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

const RailHeader: React.FC<TRailHeaderProps> = ({
  icon,
  href,
  label,
  compact,
  enableAnimation = false,
  onClick,
}) => {
  const {
    cx,
    classes: {
      header,
      headerCompact,
      headerContainer,
      startIcon,
      headerLabel,
      labelTransition,
      labelHidden,
      label: labelClass,
    },
  } = useRailStyles();

  return (
    <div className={headerContainer}>
      <Button
        href={href}
        onClick={onClick}
        variant='text'
        disableRipple
        classes={{
          root: cx(header, { [headerCompact]: compact }),
          startIcon,
        }}
        color='primary'
        startIcon={icon}
        fullWidth={compact}>
        <Typography
          variant='hero'
          classes={{
            root: cx(labelClass, headerLabel, {
              [labelTransition]: enableAnimation,
              [labelHidden]: compact,
            }),
          }}>
          {label}
        </Typography>
      </Button>
    </div>
  );
};

export default RailHeader;
