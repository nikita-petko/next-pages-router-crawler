import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CloseIcon, Grid, IconButton, makeStyles, Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import useScrollStyles from '../../hooks/useScrollStyles';
import useTools from './hooks/useTools';
import ToolSection from './components/ToolSection';
import { COLUMN_WIDTH } from '../../layout/constants';
import { CreatorType, useWorkspaces } from '../../providers/WorkspaceProvider';

const CONTAINER_PADDING = 20;

const useStyles = makeStyles()((theme) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: 465,
    height: '100%',
    gap: 16,
    borderLeft: `1px ${theme.palette.components.divider} solid`,
    borderRight: `1px ${theme.palette.components.divider} solid`,
    padding: '16px 14px 0px 14px',
    [theme.breakpoints.up('Small')]: {
      padding: `${CONTAINER_PADDING}px ${CONTAINER_PADDING}px 0px ${CONTAINER_PADDING}px`,
    },
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sections: {
    height: '100%',
  },
}));

type TAllToolsProps = {
  onToolSelect: (key: string, searchTerm?: string) => void;
  onClose: VoidFunction;
};

const AllTools: React.FC<TAllToolsProps> = ({ onToolSelect, onClose }) => {
  const {
    cx,
    classes: { container, header, sections },
  } = useStyles();
  const {
    classes: { scroll },
  } = useScrollStyles();
  const tools = useTools();
  const { translate } = useTranslation();
  const {
    currentWorkspace: { creatorType },
  } = useWorkspaces();

  const onToolSelectWrapper = useCallback(
    (key: string) => {
      onToolSelect(key);
    },
    [onToolSelect],
  );

  const ref = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(2);

  useEffect(() => {
    if (!ref.current) return undefined;

    const resizeObserver = new ResizeObserver(() => {
      const boundingBox = ref.current?.getBoundingClientRect();
      if (!boundingBox) return;

      const { right } = boundingBox;
      const rightSide = document.body.clientWidth - right;
      setColumns((prev) => {
        if (prev === 1 && rightSide > COLUMN_WIDTH + CONTAINER_PADDING * 2) {
          return 2;
        }
        if (prev === 2 && rightSide <= CONTAINER_PADDING) {
          return 1;
        }

        return prev;
      });
    });

    resizeObserver.observe(document.body);
    return () => {
      resizeObserver.unobserve(document.body);
    };
  }, []);

  const middleSectionTools = useMemo(() => {
    const sectionTools = [tools.finance, tools.analytics];

    if (creatorType === CreatorType.Group) {
      sectionTools.push(tools.collaboration);
    }

    sectionTools.push(tools.ads);

    if (process.env.buildTarget !== 'luobu' && creatorType === CreatorType.User) {
      sectionTools.push(tools.intellectualProperty);
    }

    return sectionTools;
  }, [
    creatorType,
    tools.ads,
    tools.analytics,
    tools.collaboration,
    tools.finance,
    tools.intellectualProperty,
  ]);

  return (
    <Grid ref={ref} classes={{ root: cx(container, scroll) }}>
      <Grid classes={{ root: header }}>
        <Typography variant='h2'>{translate('Heading.AllTools')}</Typography>
        <IconButton aria-label='close' onClick={onClose} color='secondary'>
          <CloseIcon />
        </IconButton>
      </Grid>

      <Grid classes={{ root: sections }}>
        <ToolSection
          columns={columns}
          onToolSelect={onToolSelectWrapper}
          tools={[
            tools.creations,
            tools.apiKeys,
            tools.oAuth2,
            tools.store,
            tools.licenses,
            tools.translation,
          ]}
        />
        <ToolSection
          columns={columns}
          onToolSelect={onToolSelectWrapper}
          tools={middleSectionTools}
        />
        <ToolSection
          columns={columns}
          onToolSelect={onToolSelectWrapper}
          tools={[
            tools.learn,
            tools.forum,
            tools.changelog,
            tools.creatorPrograms,
            tools.talent,
            tools.roadmap,
          ]}
        />
      </Grid>
    </Grid>
  );
};

export default AllTools;
