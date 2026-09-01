import type { FC, PropsWithChildren } from 'react';
import React, { useCallback, useState } from 'react';
import { Typography, Grid, IconButton, ExpandLessIcon, ExpandMoreIcon } from '@rbx/ui';

const Section: FC<PropsWithChildren<{ title: string; collapsible?: boolean }>> = ({
  title,
  children,
  collapsible = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const toggleCollapse = useCallback(() => {
    setIsExpanded((wasExpanded) => !wasExpanded);
  }, []);

  return (
    <Grid container item XSmall={12} gap='24px'>
      <Grid item XSmall={12} display='flex'>
        <Typography variant='h3' marginRight='8px'>
          {title}
        </Typography>
        {collapsible && (
          <IconButton aria-label='Expand' onClick={toggleCollapse} color='inherit' disableRipple>
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        )}
      </Grid>
      {isExpanded && children}
    </Grid>
  );
};

export default Section;
