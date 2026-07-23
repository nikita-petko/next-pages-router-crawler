// Adapted from creator-hub: https://github.rbx.com/Roblox/creator-hub/blob/master/apps/creator-hub/modules/charts-generic/components/FilterDrawer/FilterDrawerGroup.tsx

import { Collapse, Divider, ExpandLessIcon, ExpandMoreIcon, Grid, Typography } from '@rbx/ui';
import { PropsWithChildren, useCallback, useMemo, useState } from 'react';

import useFilterDrawerStyles from './FilterDrawer.styles';

type FilterDrawerGroupProps = {
  isInitiallyCollapsed?: boolean;
  name: string;
};

const FilterDrawerGroup = ({
  children,
  isInitiallyCollapsed,
  name,
}: PropsWithChildren<FilterDrawerGroupProps>) => {
  const {
    classes: { groupContainer, groupContent, groupDivider, groupHeader },
  } = useFilterDrawerStyles();

  const [isExpanded, setExpanded] = useState<boolean>(!isInitiallyCollapsed);
  const expandIcon = useMemo(
    () => (isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />),
    [isExpanded],
  );
  const toggleExpanded = useCallback(() => setExpanded((prev) => !prev), []);

  return (
    <Grid className={groupContainer} container direction='column'>
      <Grid className={groupHeader} container direction='row' item onClick={toggleExpanded}>
        <Typography variant='h6'>{name}</Typography>
        {expandIcon}
      </Grid>
      <Collapse className={groupContent} in={isExpanded}>
        <Divider className={groupDivider} />
        {children}
      </Collapse>
    </Grid>
  );
};
export default FilterDrawerGroup;
