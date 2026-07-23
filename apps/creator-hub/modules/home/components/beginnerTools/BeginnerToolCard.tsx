import React, { useCallback } from 'react';
import { Button, Card, CardMedia, Typography, makeStyles, useTheme } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { components } from '@modules/miscellaneous/common';
import { useConversionTracker } from '@modules/miscellaneous/hooks';
import { EHomepageSection } from '../../utils/eventUtils';
import type { TBeginnerToolData } from '../../constants/beginnerToolsConstants';

type BeginnerToolCardProps = TBeginnerToolData;

const { Flex } = components;
const useStyles = makeStyles()((theme) => ({
  card: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.palette.surface[200],
    padding: '24px',
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 360,
    gap: '24px',
    [theme.breakpoints.down('Medium')]: {
      flexDirection: 'column',
    },
  },
  cardTitle: {
    margin: '0px',
  },
  cardDescription: {
    margin: '8px 0px 24px',
    [theme.breakpoints.down('Medium')]: {
      marginBottom: '16px',
    },
  },
  cardAction: {
    [theme.breakpoints.down('Medium')]: {
      alignSelf: 'stretch',
    },
  },
  cardMedia: {
    ...theme.border.radius.large,
    width: 125,
    height: 125,
    [theme.breakpoints.down('Medium')]: {
      width: 'auto',
      alignSelf: 'stretch',
    },
  },
}));

export default function BeginnerToolCard({
  id,
  titleKey,
  descriptionKey,
  buttonTextKey,
  link,
  getImgSrc,
  imgAlt,
}: BeginnerToolCardProps) {
  const { translate } = useTranslation();
  const {
    palette: { mode: themeMode },
  } = useTheme();
  const { ref: tileRef, onConvert } = useConversionTracker<HTMLDivElement>('homeBeginnerToolTile', {
    additionalParams: {
      page: 'homepage',
      section: EHomepageSection.BeginnerTools,
      id,
    },
  });

  const onClick = useCallback(() => {
    onConvert('clickTile');
  }, [onConvert]);

  const {
    classes: { card, cardTitle, cardDescription, cardAction, cardMedia },
  } = useStyles();
  return (
    <Card className={card} ref={tileRef}>
      <Flex flexDirection='column' alignItems='flex-start'>
        <Typography className={cardTitle} variant='h5' paragraph>
          {translate(titleKey)}
        </Typography>
        <Typography className={cardDescription} variant='body2' color='secondary'>
          {translate(descriptionKey)}
        </Typography>
        <Button
          className={cardAction}
          variant='contained'
          color='secondary'
          href={link}
          onClick={onClick}>
          {translate(buttonTextKey)}
        </Button>
      </Flex>
      <CardMedia className={cardMedia} component='img' image={getImgSrc(themeMode)} alt={imgAlt} />
    </Card>
  );
}
