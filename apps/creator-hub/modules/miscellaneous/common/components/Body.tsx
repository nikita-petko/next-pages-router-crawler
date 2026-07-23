import React, { FunctionComponent } from 'react';
import { Typography, TTypographyProps, useMediaQuery } from '@rbx/ui';

type TBodyProps = Omit<TTypographyProps, 'variant'> & { bold?: boolean };
const Body: FunctionComponent<React.PropsWithChildren<TBodyProps>> = ({
  bold,
  children,
  ...props
}) => {
  const isSm = useMediaQuery((theme) => theme.breakpoints.down('Large'));

  if (bold === true) {
    return (
      <Typography {...props} variant={isSm ? 'captionHeader' : 'largeLabel1'}>
        {children}
      </Typography>
    );
  }

  return (
    <Typography {...props} variant={isSm ? 'body2' : 'body1'}>
      {children}
    </Typography>
  );
};

export default Body;
