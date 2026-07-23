import type { FunctionComponent } from 'react';
import React from 'react';
import { makeStyles, Typography, CardMedia, CardContent, CallMadeIcon, Link } from '@rbx/ui';
import { Flex } from '@modules/miscellaneous/components';
import { developerLandingLinkActionColor } from './Card';
import { CardContainer } from './CardContainer';

const useStyles = makeStyles()((theme) => ({
  card: {
    height: '100%',
    padding: '45px 90px 45px 40px',
    display: 'grid',
    gridTemplateColumns: '160px 1fr',
    gridTemplateRows: '1fr',
    alignItems: 'center',
    gap: 34,
  },
  cardContent: {
    height: '100%',
    padding: '0px 0px',
    '&:last-child': { paddingBottom: 0 },
  },
  cardMediaContainer: {
    width: 160,
    height: 160,
    position: 'relative',
  },
  cardMediaContainerWide: {
    width: 153,
    height: 98,
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

const LargeTileCard: FunctionComponent<React.PropsWithChildren<TCardProps>> = ({
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
      cardMediaContainerWide,
      cardMedia,
      cardDescription,
      callToAction,
    },
    cx,
  } = useStyles();

  return (
    <CardContainer data-testid='developer-large-tile-card' classes={{ root: card }} key={title}>
      <div className={cx(cardMediaContainer, { [cardMediaContainerWide]: fullWidthImage })}>
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
    </CardContainer>
  );
};

export default LargeTileCard;
