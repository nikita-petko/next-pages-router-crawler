import type { FC } from 'react';
import React, { useState, useMemo, useCallback } from 'react';
import { ExpandLessIcon, ExpandMoreIcon, Grid, Typography, Collapse, Divider } from '@rbx/ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import useFilterDrawerStyles from './FilterDrawer.styles';

export type FilterDrawerGroupProps = {
  name: FormattedText;
  isInitiallyCollapsed?: boolean;
};

export const FilterDrawerGroup: FC<React.PropsWithChildren<FilterDrawerGroupProps>> = ({
  children,
  name,
  isInitiallyCollapsed,
}) => {
  const {
    classes: { groupHeader, groupContainer, groupContent },
  } = useFilterDrawerStyles();

  const [isExpanded, setExpanded] = useState<boolean>(!isInitiallyCollapsed);
  const expandIcon = useMemo(
    () => (isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />),
    [isExpanded],
  );
  const toggleExpanded = useCallback(() => setExpanded((prev) => !prev), []);

  return (
    <Grid container direction='column' className={groupContainer}>
      <Grid item container direction='row' onClick={toggleExpanded} className={groupHeader}>
        <Typography variant='h6'>{name}</Typography>
        {expandIcon}
      </Grid>
      <Collapse in={isExpanded} className={groupContent}>
        <Divider />
        {children}
      </Collapse>
    </Grid>
  );
};
export default FilterDrawerGroup;
