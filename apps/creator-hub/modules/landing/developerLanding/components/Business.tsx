import React, { FunctionComponent } from 'react';
import { Flex } from '@modules/miscellaneous/common/components';
import { Typography, makeStyles, Link, CallMadeIcon, useMediaQuery } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { urls } from '@modules/miscellaneous/common';
import CardContainer from './common/CardContainer';
import Section from './common/Section';
import { developerLandingLinkActionColor } from './common/Card';
import { businessConstants } from '../constants/contentConstants';
import { robux3dImage } from '../constants/assetConstants';
import { EDeveloperLandingSection, captureDeveloperLandingEvent } from '../utils/eventUtils';

const {
  creatorHub: { docs },
} = urls;

const useStyles = makeStyles()((theme) => ({
  cardsContainer: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    width: '100%',
    gap: 20,
    [theme.breakpoints.down('XLarge')]: {
      gridTemplateColumns: '1fr',
      gridTemplateRows: 'auto',
      width: '100%',
    },
    [theme.breakpoints.down('Large')]: {
      maxWidth: 400,
    },
  },
  earningSection: {
    width: '100%',
    [theme.breakpoints.down('XLarge')]: {
      maxWidth: 400,
    },
  },
  card: {
    width: '100%',
    height: '100%',
    minHeight: 440,
    padding: '48px 54px',
    [theme.breakpoints.down('Large')]: {
      padding: '34px 30px',
    },
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'column',
  },
  quote: {
    fontSize: 24,
    lineHeight: '140%',
    maxWidth: 550,
    [theme.breakpoints.down('Large')]: {
      ...theme.typography.h4,
      fontWeight: 400,
    },
  },
  actionContainer: {
    ...theme.typography.footer,
    color: developerLandingLinkActionColor,
    paddingTop: 16,
    '& > svg': {
      fontSize: 16,
      paddingLeft: 5,
    },
  },
  monetizationItemImage: {
    objectFit: 'contain',
    width: '100%',
    height: '100%',
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: '50%',
    overflow: 'hidden',
  },
  monetizationItemsContainer: {
    gap: 30,
    width: '100%',
    paddingTop: 64,
  },
  monetizationItem: {
    width: 110,
    textAlign: 'center',
    [theme.breakpoints.down('Large')]: {
      flexBasis: '40%',
      flexShrink: 1,
    },
  },
  monetizationItemLabel: {
    lineHeight: '140%',
    paddingTop: 10,
  },
  robuxImageContainer: {
    height: '100%',
    width: '100%',
  },
  robuxImage: {
    maxWidth: 180,
    maxHeight: 180,
  },
  earningsAmount: {
    fontSize: 64,
    [theme.breakpoints.down(310)]: {
      fontSize: 48,
    },
  },
}));

const Business: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const {
    classes: {
      earningSection,
      monetizationItemsContainer,
      monetizationItemImage,
      imageContainer,
      monetizationItem,
      cardsContainer,
      card,
      actionContainer,
      quote,
      monetizationItemLabel,
      robuxImageContainer,
      robuxImage,
      earningsAmount,
    },
  } = useStyles();

  const { translate } = useTranslation();

  const useTwoRowsOfMonetizationItems = useMediaQuery((theme) => theme.breakpoints.down('Large'));

  return (
    <Section
      title={translate('Heading.Monetize')}
      description={translate('Description.MonetizationSubheader')}
      backgroundVariant='tall'
      section={EDeveloperLandingSection.Monetize}>
      <div className={cardsContainer}>
        <div>
          <CardContainer classes={{ root: card }}>
            <Typography classes={{ root: quote }} variant='h3' component='h3'>
              {translate('Header.WaysToMonetize')}
            </Typography>
            <Flex alignItems='center' classes={{ root: actionContainer }}>
              <Link
                href={docs.getEarningOnRobloxUrl()}
                color='inherit'
                variant='inherit'
                onClick={() =>
                  captureDeveloperLandingEvent('clickLearnMore', EDeveloperLandingSection.Monetize)
                }>
                {translate('Action.LearnMore')}
              </Link>
              <CallMadeIcon fontSize='inherit' />
            </Flex>
            <Flex
              classes={{ root: monetizationItemsContainer }}
              flexWrap='wrap'
              justifyContent={useTwoRowsOfMonetizationItems ? 'space-between' : 'flex-start'}>
              {businessConstants.map(({ image, title }) => (
                <Flex
                  key={title}
                  classes={{ root: monetizationItem }}
                  flexDirection='column'
                  alignItems='center'>
                  <div className={imageContainer}>
                    <img className={monetizationItemImage} loading='lazy' src={image} alt={title} />
                  </div>
                  <Typography
                    color='secondary'
                    classes={{ root: monetizationItemLabel }}
                    variant='body2'>
                    {translate(title)}
                  </Typography>
                </Flex>
              ))}
            </Flex>
          </CardContainer>
        </div>
        <div className={earningSection}>
          <CardContainer classes={{ root: card }}>
            <Flex
              classes={{ root: robuxImageContainer }}
              alignItems='center'
              justifyContent='center'>
              <img className={robuxImage} src={robux3dImage} loading='lazy' alt='Robux' />
            </Flex>
            <Flex flexDirection='column'>
              <Typography classes={{ root: earningsAmount }} variant='h1'>
                {translate('Label.MoneyDeliveredToCreators')}
              </Typography>
              <Typography variant='body2' color='secondary'>
                {translate('Label.DeliveredToCreatorsIn2023')}
              </Typography>
            </Flex>
          </CardContainer>
        </div>
      </div>
    </Section>
  );
};

export default Business;
