import type { FunctionComponent } from 'react';
import React, { useEffect, useState } from 'react';
import { getPrettifiedNumber } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { Grid, Typography, Card, CardHeader, Chip, PeopleIcon, Avatar, Link } from '@rbx/ui';
import gamesClient, { type GameDetailResponse } from '@modules/clients/games';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { www } from '@modules/miscellaneous/urls';
import {
  bloxFruitsPath,
  fischPath,
  adoptMePath,
  bedWarsPath,
  petSimulatorPath,
  doorsPath,
  murderMystery2Path,
  dressToImpressPath,
} from '../../constants/gameConstants';
import mockGameDetailsResponse from '../../landing/constants/mockGameDetailsResponse';
import { getCreatorUrl } from '../utils/urlUtils';
import useExperiencesStyles from './Experiences.styles';

const experienceIds = {
  bloxFruits: 994732206,
  fisch: 5750914919,
  adoptMe: 383310974,
  bedWars: 2619619496,
  petSimulator: 3317771874,
  doors: 2440500124,
  murderMystery2: 66654135,
  dressToImpress: 5203828273,
};

const experienceAssets = {
  bloxFruits: bloxFruitsPath,
  fisch: fischPath,
  adoptMe: adoptMePath,
  bedWars: bedWarsPath,
  petSimulator: petSimulatorPath,
  doors: doorsPath,
  murderMystery2: murderMystery2Path,
  dressToImpress: dressToImpressPath,
};

export const Experience: FunctionComponent<
  React.PropsWithChildren<{
    details?: GameDetailResponse;
    imageUrl: string;
  }>
> = ({ details, imageUrl }) => {
  const { translate, translateHTML } = useTranslation();
  const [hover, setHover] = useState(false);
  const {
    classes: {
      link,
      experienceContainer,
      imageContainer,
      image,
      blur,
      card,
      hoverStat,
      hoverContainer,
      hoverText,
      show,
    },

    cx,
  } = useExperiencesStyles();

  return (
    <Grid
      onTouchStart={() => {
        setHover(true);
      }}
      onMouseEnter={() => {
        setHover(true);
      }}
      onTouchEnd={() => {
        setHover(false);
      }}
      onMouseLeave={() => {
        setHover(false);
      }}
      className={experienceContainer}
      container
      item
      id={details?.name}>
      <Grid className={imageContainer}>
        {process.env.targetEnvironment === 'production' ? (
          <Thumbnail2d
            data-testid='landing-experience-thumbnail'
            containerClass={cx(image, { [blur]: hover && details !== undefined })}
            targetId={details?.id ?? 0}
            type={ThumbnailTypes.universeThumbnail}
            alt={details?.name ?? ''}
          />
        ) : (
          <img
            data-testid='landing-experience-thumbnail'
            className={cx(image, { [blur]: hover && details !== undefined })}
            src={imageUrl}
            alt={details?.name}
          />
        )}
        <Card
          classes={{
            root: cx(card, {
              [show]: hover && details !== undefined,
            }),
          }}>
          <CardHeader
            classes={{
              content: hoverContainer,
              title: hoverText,
              subheader: hoverText,
              action: hoverStat,
            }}
            avatar={
              <Avatar alt={details?.name ?? translate('Label.Thumbnail')} variant='rounded'>
                <Thumbnail2d
                  targetId={details?.rootPlaceId ?? 0}
                  type={ThumbnailTypes.placeIcon}
                  alt={details?.name ?? ''}
                />
              </Avatar>
            }
            title={
              <Link
                target='_blank'
                classes={{ root: link }}
                href={www.getGameDetailsUrl(details?.rootPlaceId ?? 0)}>
                {details?.name}
              </Link>
            }
            subheader={translateHTML('Label.CreatorLink1', [
              {
                opening: 'linkStart',
                closing: 'linkEnd',
                content() {
                  return (
                    <Link
                      target='_blank'
                      classes={{ root: link }}
                      href={getCreatorUrl(details?.creator?.type ?? '', details?.creator?.id ?? 0)}>
                      {details?.creator?.name}
                    </Link>
                  );
                },
              },
            ])}
            action={
              <Chip
                size='small'
                color='secondary'
                icon={<PeopleIcon />}
                label={getPrettifiedNumber(details?.playing ?? 0)}
              />
            }
          />
        </Card>
      </Grid>
    </Grid>
  );
};

const Experiences: FunctionComponent<React.PropsWithChildren> = () => {
  const { translate } = useTranslation();
  const [gameDetails, setGameDetails] = useState<Record<number, GameDetailResponse>>({});
  const {
    classes: { root, heading, experiencesContainer },
  } = useExperiencesStyles();

  useEffect(() => {
    const getGameDetails = async () => {
      try {
        const { data = [] } = await gamesClient.getDetails(Object.values(experienceIds));
        const parsedData = data.reduce<Record<number, GameDetailResponse>>((acc, curr) => {
          acc[curr.id ?? 0] = curr;
          return acc;
        }, {});
        setGameDetails(parsedData);
      } catch {
        // Fail slightly
      }
    };
    const mockGameDetails = async () => {
      setGameDetails(mockGameDetailsResponse);
    };

    if (process.env.bedev1BaseDomain === 'roblox.com') {
      getGameDetails();
    } else {
      mockGameDetails();
    }
  }, []);

  return (
    <Grid className={root} container direction='column' alignItems='center' justifyContent='center'>
      <Grid className={heading} item>
        <Typography variant='h3' component='h3' align='center'>
          {translate('Heading.LargestOnlineExperiences')}
        </Typography>
      </Grid>
      <Grid className={experiencesContainer} container direction='row'>
        {Object.keys(experienceIds).map((experience) => {
          const experienceId = experienceIds[experience as keyof typeof experienceIds];
          const experienceAsset = experienceAssets[experience as keyof typeof experienceIds];

          return (
            <Experience
              key={experienceId}
              details={gameDetails[experienceId]}
              imageUrl={experienceAsset}
            />
          );
        })}
      </Grid>
    </Grid>
  );
};

export default withTranslation(Experiences, [TranslationNamespace.Landing]);
