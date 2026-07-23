import React, { FunctionComponent } from 'react';
import { Typography, TTypographyProps, useMediaQuery } from '@rbx/ui';

type TSubHeaderProps = Omit<TTypographyProps, 'variant'>;
const SubHeader: FunctionComponent<React.PropsWithChildren<TSubHeaderProps>> = ({
  children,
  ...props
}) => {
  const isSm = useMediaQuery((theme) => theme.breakpoints.down('Large'));

  return (
    <Typography {...props} variant={isSm ? 'h5' : 'h3'}>
      {children}
    </Typography>
  );
};

export default SubHeader;
