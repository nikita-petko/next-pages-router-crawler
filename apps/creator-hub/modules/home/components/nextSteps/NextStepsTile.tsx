import React, { FunctionComponent } from 'react';
import { CardActionArea, makeStyles, Typography } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { withTranslation, useTranslation } from '@rbx/intl';
import { useConversionTracker } from '@modules/miscellaneous/hooks';
import Card from '../common/Card';
import CardContent from '../common/CardContent';
import { EHomepageSection } from '../../utils/eventUtils';

import { TNextStepsTopic } from '../../constants/nextStepsConstants';
import { NextStepsTileSize } from '../../constants/tileConstants';

const useStyles = makeStyles()({
  card: {
    width: NextStepsTileSize.small.width,
    minHeight: NextStepsTileSize.small.height,
  },
  content: {
    padding: 24,
  },
  cardActionArea: {
    height: '100%',
  },
  icon: {
    fontSize: 24,
    marginBottom: 12,
  },
  header: {
    display: 'block',
    lineClamp: 2,
    WebkitLineClamp: 2,
    maxHeight: 47,
    marginBottom: 6,
    overflow: 'hidden',
    boxOrient: 'vertical',
    WebkitBoxOrient: 'vertical',
    '@supports (display: -webkit-box)': {
      display: '-webkit-box',
    },
  },
  description: {
    display: 'block',
    lineClamp: 2,
    WebkitLineClamp: 2,
    maxHeight: 38,
    overflow: 'hidden',
    boxOrient: 'vertical',
    '-webkit-box-orient': 'vertical',
    '@supports (display: -webkit-box)': {
      display: '-webkit-box',
    },
  },
});

type TNextStepsTileProps = { data: TNextStepsTopic };
export const NextStepsTile: FunctionComponent<React.PropsWithChildren<TNextStepsTileProps>> = ({
  data: { id, title, description, url, IconComponent, openInNewTab },
}) => {
  const { translate } = useTranslation();
  const { ref: tileRef, onConvert } = useConversionTracker<HTMLDivElement>('homeNextStepTile', {
    additionalParams: {
      page: 'homepage',
      section: EHomepageSection.ExploreCreatorHub,
      id,
    },
  });

  const {
    classes: { card, content, icon, header, description: descriptionText, cardActionArea },
    cx,
  } = useStyles();

  return (
    <Card classes={{ root: card }} ref={tileRef} variant='outlined'>
      <CardActionArea
        onClick={() => {
          onConvert('clickTile');
        }}
        classes={{ root: cx(card, cardActionArea) }}
        disableRipple
        href={url}
        target={openInNewTab ? '_blank' : '_self'}
        rel='noreferrer noopener'>
        <CardContent classes={{ root: content }}>
          <IconComponent classes={{ root: icon }} />

          <Typography classes={{ root: header }} variant='h6'>
            {translate(title)}
          </Typography>

          <Typography classes={{ root: descriptionText }} variant='body2' color='secondary'>
            {translate(description)}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default withTranslation(NextStepsTile, [TranslationNamespace.Home]);
