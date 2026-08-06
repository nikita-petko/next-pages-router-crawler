import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from '@rbx/intl';
import { CloseIcon, Grid, IconButton, makeStyles, Typography } from '@rbx/ui';
import useScrollStyles from '../../hooks/useScrollStyles';
import { COLUMN_WIDTH, RAIL_DIVIDER_WIDTH, RAIL_HORIZONTAL_PADDING } from '../../layout/constants';
import { CreatorType, useWorkspaces } from '../../providers/WorkspaceProvider';
import ToolSection from './components/ToolSection';
import useTools from './hooks/useTools';
import { getMostSpecificActiveToolKey, getToolHrefCandidates } from './utils/isToolHrefActive';

const CONTAINER_PADDING = RAIL_HORIZONTAL_PADDING;

const useStyles = makeStyles()((theme) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: 430,
    maxWidth: 430,
    height: '100%',
    gap: 0,
    borderLeft: `${RAIL_DIVIDER_WIDTH}px ${theme.palette.components.divider} solid`,
    borderRight: `${RAIL_DIVIDER_WIDTH}px ${theme.palette.components.divider} solid`,
    // Equal 16px gutters; side borders sit outside the padded content (same as secondary).
    padding: `${RAIL_HORIZONTAL_PADDING}px ${RAIL_HORIZONTAL_PADDING}px 0px ${RAIL_HORIZONTAL_PADDING}px`,
  },
  header: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    height: 40,
    minHeight: 40,
    // Same inset as LeftNavigationMenuV2 header
    paddingLeft: 12,
    paddingRight: 8,
  },
  // Match LeftNavigationMenuV2 / secondary rail TitleLarge headers
  title: {
    overflow: 'hidden',
    color: 'var(--color-content-emphasis)',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontFamily: 'var(--Config-Text-Font, "Builder Sans")',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: 700,
    lineHeight: '140%',
    margin: 0,
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--color-content-default)',
  },
  sections: {
    // Size to content so the panel’s overflowY:scroll can reach Collaboration
    // (and the rest of the flyout). height:100% / flex-shrink clipped the
    // taller group layout — overflow:visible paint does not grow scrollHeight.
    flex: '0 0 auto',
  },
}));

type TAllToolsProps = {
  onToolSelect: (key: string, searchTerm?: string) => void;
  onClose: VoidFunction;
};

const AllTools: React.FC<TAllToolsProps> = ({ onToolSelect, onClose }) => {
  const {
    cx,
    classes: { container, header, title, closeButton, sections },
  } = useStyles();
  const {
    classes: { scroll },
  } = useScrollStyles();
  const tools = useTools();
  const { asPath } = useRouter();
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
    if (!ref.current) {
      return undefined;
    }

    const resizeObserver = new ResizeObserver(() => {
      const boundingBox = ref.current?.getBoundingClientRect();
      if (!boundingBox) {
        return;
      }

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

  const firstSectionTools = useMemo(
    () => [
      tools.creations,
      tools.apiKeys,
      tools.oAuth2,
      tools.store,
      tools.licenses,
      tools.translation,
    ],
    [tools.apiKeys, tools.creations, tools.licenses, tools.oAuth2, tools.store, tools.translation],
  );

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

  const lastSectionTools = useMemo(
    () => [
      tools.learn,
      tools.forum,
      tools.changelog,
      tools.creatorPrograms,
      tools.talent,
      tools.roadmap,
    ],
    [tools.changelog, tools.creatorPrograms, tools.forum, tools.learn, tools.roadmap, tools.talent],
  );

  // Compare across every All Tools link so /updates/roadmap selects Roadmap,
  // not Changelog (whose /updates href is only a prefix match).
  const selectedKey = useMemo(
    () =>
      getMostSpecificActiveToolKey(
        getToolHrefCandidates(
          [...firstSectionTools, ...middleSectionTools, ...lastSectionTools].filter(
            (tool): tool is NonNullable<typeof tool> => Boolean(tool),
          ),
        ),
        asPath,
      ),
    [asPath, firstSectionTools, lastSectionTools, middleSectionTools],
  );

  return (
    <Grid ref={ref} classes={{ root: cx(container, scroll) }}>
      <Grid classes={{ root: header }}>
        <Typography variant='h2' classes={{ root: title }}>
          {translate('Heading.AllTools')}
        </Typography>
        <IconButton
          className={closeButton}
          aria-label={translate('AriaLabel.Close')}
          onClick={onClose}
          color='secondary'>
          <CloseIcon />
        </IconButton>
      </Grid>

      <Grid classes={{ root: sections }}>
        <ToolSection
          isFirst
          columns={columns}
          onToolSelect={onToolSelectWrapper}
          selectedKey={selectedKey}
          tools={firstSectionTools}
        />
        <ToolSection
          columns={columns}
          onToolSelect={onToolSelectWrapper}
          selectedKey={selectedKey}
          tools={middleSectionTools}
        />
        <ToolSection
          columns={columns}
          onToolSelect={onToolSelectWrapper}
          selectedKey={selectedKey}
          tools={lastSectionTools}
        />
      </Grid>
    </Grid>
  );
};

export default AllTools;
