import React from 'react';
import Link from 'next/link';
import { useTranslation } from '@rbx/intl';
import type { TTypographyProps } from '@rbx/ui';
import { Grid, Typography, makeStyles } from '@rbx/ui';
import { COMPACT_TRANSITION_DURATION } from '../../../layout/constants';
import type { TWorkspace } from '../../../providers/WorkspaceProvider/constants';
import useProductUrls from '../../../utils/useProductUrls';
import WorkspaceThumbnailContainer from './WorkplaceThumbnailContainer';

type TWorkplaceItemProps = {
  workspace: TWorkspace;
  adornment?: React.JSX.Element;
  collapsed?: boolean;
  showLink?: boolean;
  size?: 'small' | 'large';
  variant?: TTypographyProps['variant'];
};

const AVATAR_SIZE = 24;

const useStyles = makeStyles()((theme) => ({
  root: {
    width: '100%',
    height: '100%',
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto',
    alignItems: 'center',
    gap: 18,
  },
  avatar: {
    height: AVATAR_SIZE,
    width: AVATAR_SIZE,
    minHeight: AVATAR_SIZE,
    minWidth: AVATAR_SIZE,
    maxHeight: AVATAR_SIZE,
    maxWidth: AVATAR_SIZE,
  },
  largeAvatar: {
    height: 32,
    width: 32,
  },
  label: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    // lineHeight 100% is casing the bottoms of letters like y and g to be clipped
    lineHeight: 'unset',
    transition: `opacity ${COMPACT_TRANSITION_DURATION}ms ease-out`,
    [theme.breakpoints.up('Large')]: {
      fontSize: 14,
    },
  },
  hiddenLabel: {
    opacity: 0,
  },
}));

const WorkplaceItem: React.FunctionComponent<TWorkplaceItemProps> = ({
  workspace,
  adornment,
  showLink,
  variant = 'smallLabel2',
  collapsed = false,
  size = 'small',
}) => {
  const {
    cx,
    classes: { root, label, hiddenLabel, largeAvatar, avatar },
  } = useStyles();
  const { translate } = useTranslation();
  const { Roblox } = useProductUrls();

  return (
    <Grid classes={{ root }}>
      <WorkspaceThumbnailContainer
        creator={workspace}
        className={size === 'large' ? largeAvatar : avatar}
      />
      <Grid sx={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Typography
          variant={variant}
          title={workspace.creatorName}
          classes={{
            root: cx(label, {
              [hiddenLabel]: collapsed,
            }),
          }}
          noWrap>
          {workspace.creatorName}
        </Typography>
        {showLink && (
          <Link
            href={Roblox.getCommunitiesUrl(workspace.creatorId)}
            style={{ textDecoration: 'none' }}>
            <Typography color='secondary' variant='legalDisclaimer' noWrap>
              {translate('Heading.ViewOnRoblox')}
            </Typography>
          </Link>
        )}
      </Grid>
      {adornment}
    </Grid>
  );
};

export default WorkplaceItem;
