import type { FunctionComponent } from 'react';
import React, { useCallback } from 'react';
import { Card, Typography, CallMadeIcon, CardActionArea, makeStyles } from '@rbx/ui';

const useStyles = makeStyles()((theme) => ({
  root: {
    backgroundColor: theme.palette.surface[200],
    width: 250,
  },
  card: {
    display: 'flex',
    height: '100%',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  text: {
    display: 'block',
    textAlign: 'center',
    marginTop: 6,
  },
}));

type TShowMoreCardProps = {
  url: string;
  headerText: string;
  descriptionText: string;
  onClick?: () => void;
};

export const ShowMoreCard: FunctionComponent<React.PropsWithChildren<TShowMoreCardProps>> = ({
  url,
  headerText,
  descriptionText,
  onClick,
}) => {
  const {
    classes: { root, card, text },
  } = useStyles();

  const onCardClick = useCallback(() => {
    onClick?.();

    window.open(url);
  }, [onClick, url]);

  return (
    <Card classes={{ root }} data-testid='show-more-card'>
      <CardActionArea onClick={onCardClick} classes={{ root: card }} disableRipple href={url}>
        <div className={card}>
          <CallMadeIcon fontSize='large' color='primary' />
          <Typography classes={{ root: text }} variant='h6'>
            {headerText}
          </Typography>
          <Typography classes={{ root: text }} color='secondary' variant='body2'>
            {descriptionText}
          </Typography>
        </div>
      </CardActionArea>
    </Card>
  );
};

export default ShowMoreCard;
