import React, { FunctionComponent } from 'react';
import { Typography } from '@rbx/ui';
import TopNavigationSidebarHeader from './TopNavigationSidebarHeader';
import CurrentProductName from './CurrentProductName';

const TopNavigationSidebarProductHeader: FunctionComponent<{ className?: string }> = ({
  className
}) => {
  return (
    <TopNavigationSidebarHeader className={className}>
      <Typography variant='largeLabel1'>
        <CurrentProductName />
      </Typography>
    </TopNavigationSidebarHeader>
  );
};

export default TopNavigationSidebarProductHeader;
