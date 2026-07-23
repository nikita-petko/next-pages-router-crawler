import type { FC, ReactNode } from 'react';
import React from 'react';
import {
  CancelOutlinedIcon,
  CircularProgress,
  Container,
  HelpOutlineOutlinedIcon,
  LockIcon,
  makeStyles,
  Typography,
} from '@rbx/ui';
import ChartAbnormalStatus from './ChartAbnormalStatus';

export type ChartPlaceholderProps = {
  status: ChartAbnormalStatus;
  description?: string;
  secondaryDescription?: string;
};

const useStyles = makeStyles()((theme) => ({
  container: {
    textAlign: 'center',
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    display: 'grid',
    placeItems: 'center',
    // The overlay sits on top of a still-mounted chart. Let pointer events
    // fall through so hover tooltips / clicks reach the chart underneath.
    pointerEvents: 'none',
  },
  content: {
    // Re-enable pointer events on just the message block so the text stays
    // selectable while the rest of the overlay remains pass-through.
    pointerEvents: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  icon: {
    fontSize: 32,
    color: theme.palette.content.muted,
  },
}));

const statusIcon = (status: ChartAbnormalStatus): ReactNode => {
  switch (status) {
    case ChartAbnormalStatus.NoData:
      return <HelpOutlineOutlinedIcon fontSize='inherit' />;
    case ChartAbnormalStatus.Error:
      return <CancelOutlinedIcon fontSize='inherit' />;
    case ChartAbnormalStatus.NoAccess:
      return <LockIcon fontSize='inherit' />;
    case ChartAbnormalStatus.Loading:
      return null;
    default:
      return null;
  }
};

const ChartPlaceholder: FC<ChartPlaceholderProps> = ({
  status,
  description,
  secondaryDescription,
}) => {
  const {
    classes: { container, content, icon },
  } = useStyles();

  const isLoading = status === ChartAbnormalStatus.Loading;
  const iconNode = statusIcon(status);

  return (
    <Container disableGutters classes={{ root: container }}>
      <div className={content}>
        {isLoading ? <CircularProgress /> : null}
        {iconNode ? <span className={icon}>{iconNode}</span> : null}
        <Typography display='block' variant='h6'>
          {description}
        </Typography>
        <Typography display='block' variant='body2'>
          {secondaryDescription}
        </Typography>
      </div>
    </Container>
  );
};

export default ChartPlaceholder;
