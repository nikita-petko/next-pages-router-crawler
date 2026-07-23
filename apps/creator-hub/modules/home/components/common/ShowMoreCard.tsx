import type { FunctionComponent } from 'react';
import React from 'react';
import Link from 'next/link';
import { Typography, CallMadeIcon, CardActionArea, makeStyles } from '@rbx/ui';
import { ExperienceWithAnalyticsTileSizeV2 } from '../../constants/tileConstants';
import Card from './Card';
import CardContent from './CardContent';

const useStyles = makeStyles<{ width: number; isV2: boolean }>()((theme, { width, isV2 }) => ({
  root: {
    ...(!isV2 && { backgroundColor: theme.palette.surface[200] }),
    width,
    ...(isV2 && { height: ExperienceWithAnalyticsTileSizeV2.height }),
  },
  card: {
    display: 'flex',
    height: '100%',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    display: 'block',
    textAlign: 'center',
    marginTop: 6,
  },
}));

type TShowMoreCardProps = {
  classes?: Partial<{ root: string }>;
  url: string;
  width: number;
  isV2?: boolean;
  headerText: string;
  descriptionText: string;
  onClick?: () => void;
};

const ShowMoreCard: FunctionComponent<React.PropsWithChildren<TShowMoreCardProps>> = ({
  classes,
  url,
  onClick,
  width,
  isV2 = false,
  headerText,
  descriptionText,
}) => {
  const {
    classes: { root, card, text },

    cx,
  } = useStyles({ width, isV2 });
  return (
    <Card
      classes={{
        root: cx(root, isV2 && 'stroke-standard stroke-muted hover:bg-shift-100', classes?.root),
      }}>
      <CardActionArea
        LinkComponent={Link}
        onClick={onClick}
        classes={{ root: card }}
        disableRipple
        href={url}>
        <CardContent classes={{ root: card }}>
          <CallMadeIcon fontSize='large' color={isV2 ? 'inherit' : 'primary'} />
          <Typography classes={{ root: text }} variant='h6'>
            {headerText}
          </Typography>
          <Typography classes={{ root: text }} color='secondary' variant='body2'>
            {descriptionText}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default ShowMoreCard;
