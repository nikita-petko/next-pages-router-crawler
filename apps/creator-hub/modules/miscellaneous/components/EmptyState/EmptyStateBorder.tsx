import type { FC } from 'react';
import React from 'react';
import Flex from '../Flex';
import useEmptyStateBorderStyles from './EmptyStateBorder.styles';

// NOTE(shumingxu, 03/28/2024): Simple component to wrap EmptyState with border
const EmptyStateBorder: FC<React.PropsWithChildren> = ({ children }) => {
  const {
    classes: { emptyStateContainer },
  } = useEmptyStateBorderStyles();

  return (
    <Flex
      flexDirection='column'
      justifyContent='center'
      alignItems='center'
      classes={{ root: emptyStateContainer }}>
      {children}
    </Flex>
  );
};

export default EmptyStateBorder;
