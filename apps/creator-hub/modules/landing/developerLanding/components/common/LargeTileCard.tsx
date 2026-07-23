import React, { FunctionComponent } from 'react';
import { makeStyles, Typography, CardMedia, CardContent, CallMadeIcon, Link } from '@rbx/ui';
import { components } from '@modules/miscellaneous/common';
import CardContainer from './CardContainer';
import { developerLandingLinkActionColor } from './Card';

const { Flex } = components;

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
  onClick?: () => void;
};

const LargeTileCard: FunctionComponent<React.PropsWithChildren<TCardProps>> = ({
  title,
  description,
  url,
  link,
  image,
  alt,
  onClick,
}) => {
  const {
    classes: { card, cardContent, cardMediaContainer, cardMedia, cardDescription, callToAction },
  } = useStyles();

  return (
    <CardContainer data-testid='developer-large-tile-card' classes={{ root: card }} key={title}>
      <div className={cardMediaContainer}>
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
            <Typography variant='h6'>{title}</Typography>
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
