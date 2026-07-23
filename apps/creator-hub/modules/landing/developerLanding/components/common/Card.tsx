import type { FunctionComponent } from 'react';
import React from 'react';
import { makeStyles, Typography, CardMedia, CardContent, CallMadeIcon, Link } from '@rbx/ui';
import { Flex } from '@modules/miscellaneous/components';
import { CardContainer } from './CardContainer';

export const developerLandingLinkActionColor = '#528BFF';

const useStyles = makeStyles()((theme) => ({
  card: {
    height: '100%',
  },
  cardContent: {
    height: '100%',
    padding: '24px 24px',
  },
  cardMediaContainer: {
    width: 160,
    height: 160,
    marginTop: '10%',
    position: 'relative',
  },
  cardMediaContainerFullWidth: {
    paddingTop: '200px',
    marginTop: '0',
    width: '100%',
  },
  cardMedia: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    width: '100%',
  },
  cardDescription: {
    padding: '15px 0',
  },
  callToAction: {
    ...theme.typography.footer,
    color: developerLandingLinkActionColor,
    '& > svg': {
      fontSize: 16,
      paddingLeft: 5,
    },
  },
}));

type TCardProps = {
  title: string;
  description: string;
  url: string;
  link: string;
  image: string;
  alt: string;
  fullWidthImage?: boolean;
  badge?: React.ReactNode;
  onClick?: () => void;
};

const Card: FunctionComponent<React.PropsWithChildren<TCardProps>> = ({
  title,
  description,
  url,
  link,
  image,
  alt,
  fullWidthImage,
  badge,
  onClick,
}) => {
  const {
    classes: {
      card,
      cardContent,
      cardMediaContainer,
      cardMediaContainerFullWidth,
      cardMedia,
      cardDescription,
      callToAction,
    },

    cx,
  } = useStyles();

  return (
    <CardContainer classes={{ root: card }} data-testid='developer-common-card' key={title}>
      <Flex flexDirection='column' justifyContent='space-between' alignItems='center'>
        <div
          className={cx(cardMediaContainer, {
            [cardMediaContainerFullWidth]: fullWidthImage,
          })}>
          <CardMedia
            classes={{ root: cardMedia }}
            image={image}
            component='img'
            loading='lazy'
            alt={alt}
          />
        </div>
        <CardContent classes={{ root: cardContent }}>
          <Flex>
            <Flex flexDirection='column'>
              <div className='flex items-center gap-[10px]'>
                <Typography variant='h6'>{title}</Typography>
                {badge}
              </div>
              <Typography classes={{ root: cardDescription }} variant='body2' color='secondary'>
                {description}
              </Typography>
              <Flex alignItems='center' classes={{ root: callToAction }}>
                <Link href={url} color='inherit' variant='inherit' onClick={onClick}>
                  {link}
                </Link>
                <CallMadeIcon fontSize='inherit' />
              </Flex>
            </Flex>
          </Flex>
        </CardContent>
      </Flex>
    </CardContainer>
  );
};

export default Card;
