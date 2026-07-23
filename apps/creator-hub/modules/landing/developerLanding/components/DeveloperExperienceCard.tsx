import type { FunctionComponent } from 'react';
import React from 'react';
import { getPrettifiedNumber } from '@rbx/core';
import { Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import {
  CardContent,
  Link,
  Typography,
  RobloxIcon,
  PlayingIcon,
  makeStyles,
  CardActionArea,
} from '@rbx/ui';
import type { GameDetailResponse } from '@modules/clients/games';
import { Flex } from '@modules/miscellaneous/components/Flex';
import { www } from '@modules/miscellaneous/urls';
import { getCreatorUrl } from '../../sections/utils/urlUtils';
import { EDeveloperLandingSection, captureDeveloperLandingEvent } from '../utils/eventUtils';
import { CardContainer } from './common/CardContainer';

const useStyles = makeStyles()((theme) => ({
  card: {
    height: 255,
    width: 310,
    borderRadius: 6,
  },
  cardAction: {
    height: '100%',
    borderRadius: 6,
  },
  thumbnailContainer: {
    width: '100%',
    position: 'relative',
    height: 175,
  },
  thumbnail: {
    position: 'absolute',
    top: 0,
    left: 0,
    objectFit: 'cover',
    height: '100%',
    width: '100%',
  },
  cardContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  robloxLogo: {
    height: 14,
    width: 14,
  },
  playingIcon: {
    height: 20,
    width: 20,
  },
  leftContentContainer: {
    gap: 6,
    minWidth: 0,
  },
  rightContentContainer: {
    gap: 6,
  },
  linkContainer: {
    gap: 5,
    color: theme.palette.content.muted,
  },
  textEllipsis: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}));

type TDeveloperExperienceCardProps = {
  details?: GameDetailResponse;
  imageUrl: string;
};

const DeveloperExperienceCard: FunctionComponent<
  React.PropsWithChildren<TDeveloperExperienceCardProps>
> = ({ details, imageUrl }) => {
  const {
    classes: {
      card,
      cardAction,
      textEllipsis,
      leftContentContainer,
      rightContentContainer,
      linkContainer,
      thumbnailContainer,
      thumbnail,
      robloxLogo,
      playingIcon,
      cardContent,
    },

    cx,
  } = useStyles();

  const image =
    process.env.targetEnvironment === 'production' ? (
      <Thumbnail2d
        containerClass={thumbnail}
        targetId={details?.id ?? 0}
        type={ThumbnailTypes.universeThumbnail}
        data-testid='experience-thumbnail'
        alt={details?.name ?? ''}
      />
    ) : (
      <img
        className={thumbnail}
        src={imageUrl}
        data-testid='experience-thumbnail'
        loading='lazy'
        alt={details?.name}
      />
    );

  return (
    <CardContainer classes={{ root: card }}>
      <CardActionArea
        classes={{ root: cardAction }}
        href={www.getGameDetailsUrl(details?.rootPlaceId ?? 0)}
        onClick={() =>
          captureDeveloperLandingEvent('clickExperience', EDeveloperLandingSection.Experiences, {
            experienceId: details?.id?.toString() ?? '',
          })
        }>
        <div className={thumbnailContainer}>{image}</div>
        <CardContent className={cardContent}>
          <Flex flexDirection='column' classes={{ root: leftContentContainer }}>
            <Typography classes={{ root: textEllipsis }} variant='h6'>
              {details?.name}
            </Typography>
            <Flex
              classes={{ root: cx(linkContainer, textEllipsis) }}
              flexDirection='row'
              alignItems='center'>
              <RobloxIcon className={robloxLogo} />
              <Link
                target='_blank'
                color='inherit'
                href={getCreatorUrl(details?.creator?.type ?? '', details?.creator?.id ?? 0)}
                onClick={() => {
                  const creator = details?.creator;
                  if (!creator || !creator.id) {
                    return;
                  }
                  captureDeveloperLandingEvent(
                    'clickExperienceCreator',
                    EDeveloperLandingSection.Experiences,
                    {
                      creatorUserId: creator.type === 'User' ? creator.id.toString() : '',
                      creatorGroupId: creator.type === 'Group' ? creator.id.toString() : '',
                    },
                  );
                }}
                underline='hover'>
                {details?.creator?.name}
              </Link>
            </Flex>
          </Flex>
          <Flex classes={{ root: rightContentContainer }} flexDirection='row'>
            <PlayingIcon className={playingIcon} />
            <Typography variant='h6'>{getPrettifiedNumber(details?.playing ?? 0)}</Typography>
          </Flex>
        </CardContent>
      </CardActionArea>
    </CardContainer>
  );
};

export default DeveloperExperienceCard;
