import type { FunctionComponent } from 'react';
import React from 'react';
import type { TTabsProps } from '@rbx/ui';
import { Tabs, useMediaQuery } from '@rbx/ui';
import useHorizontalTabsStyles from './HorizontalTabs.styles';

export interface HorizontalTabsProps {
  value?: unknown;
  onChange?: (event: React.ChangeEvent<object>, value: unknown) => void;
  includeBackground?: boolean;
  className?: string;
}

const HorizontalTabs: FunctionComponent<React.PropsWithChildren<HorizontalTabsProps>> = ({
  onChange,
  includeBackground,
  className,
  ...otherProps
}) => {
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const {
    classes: { filledMenuTab },

    cx,
  } = useHorizontalTabsStyles();

  if (includeBackground) {
    return (
      <Tabs
        className={cx(className, filledMenuTab)}
        onChange={onChange as TTabsProps['onChange']}
        variant={isCompactView ? 'scrollable' : 'fullWidth'}
        orientation='horizontal'
        {...otherProps}
      />
    );
  }

  return (
    <Tabs
      className={cx(className)}
      onChange={onChange as TTabsProps['onChange']}
      variant='scrollable'
      orientation='horizontal'
      {...otherProps}
    />
  );
};

export default HorizontalTabs;
