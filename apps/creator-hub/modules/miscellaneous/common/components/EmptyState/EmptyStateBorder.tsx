import { Flex } from '@modules/miscellaneous/common/components';
import React, { FC } from 'react';
import useEmptyStateBorderStyles from './EmptyStateBorder.styles';

// NOTE(shumingxu, 03/28/2024): Simple component to wrap EmptyState with border
const EmptyStateBorder: FC<React.PropsWithChildren<unknown>> = ({ children }) => {
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
