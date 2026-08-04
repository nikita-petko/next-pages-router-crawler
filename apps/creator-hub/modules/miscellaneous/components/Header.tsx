import type { FunctionComponent } from 'react';
import React from 'react';
import type { TTypographyProps } from '@rbx/ui';
import { Typography, useMediaQuery } from '@rbx/ui';

type THeaderProps = Omit<TTypographyProps, 'variant'>;
const Header: FunctionComponent<React.PropsWithChildren<THeaderProps>> = ({
  children,
  ...props
}) => {
  const isSm = useMediaQuery((theme) => theme.breakpoints.down('Large'));

  return (
    <Typography {...props} variant={isSm ? 'h3' : 'h1'}>
      {children}
    </Typography>
  );
};

export default Header;
