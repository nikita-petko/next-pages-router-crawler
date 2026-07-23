import React, { useMemo, useRef } from 'react';
import { Divider, Grid, makeStyles } from '@rbx/ui';
import { TTool } from '../hooks/useTools';
import ToolsList from './ToolsList';
import { COLUMN_WIDTH } from '../../../layout/constants';

type TToolSectionProps = {
  tools: (TTool | undefined)[];
  columns: number;
  onToolSelect: (key: string) => void;
};

const useStyles = makeStyles()(() => ({
  container: {
    padding: '6px 0px',
    display: 'flex',
    flexDirection: 'column',
  },
  itemsGrid: {
    padding: '12px 4px',
  },
}));

const ToolSection: React.FC<TToolSectionProps> = ({ onToolSelect, columns, tools }) => {
  const ref = useRef<HTMLDivElement>(null);
  const {
    classes: { container, itemsGrid },
  } = useStyles();
  const filter = useMemo(() => tools.filter((tool): tool is TTool => Boolean(tool)), [tools]);

  if (filter.length === 0) {
    return null;
  }

  return (
    <Grid ref={ref} classes={{ root: container }}>
      <Divider />
      <Grid classes={{ root: itemsGrid }} sx={{ columns: `${columns} ${COLUMN_WIDTH}px` }}>
        {filter.map((tool) => (
          <ToolsList onToolSelect={onToolSelect} key={tool.key} tool={tool} />
        ))}
      </Grid>
    </Grid>
  );
};

export default ToolSection;
