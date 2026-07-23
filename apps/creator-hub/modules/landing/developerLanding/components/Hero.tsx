import { Flex } from '@modules/miscellaneous/common/components';
import React, { FunctionComponent } from 'react';
import { alpha, makeStyles, Typography, Divider, useMediaQuery } from '@rbx/ui';
import { topNavigationHeights } from '@modules/navigation/layout/components/Layout.styles';
import { useTranslation } from '@rbx/intl';
import { heroBackgroundVideoSources, heroBackgroundPoster } from '../constants/assetConstants';
import { DEVELOPER_LANDING_HORIZONTAL_PADDING } from './DeveloperContainer.styles';
import HeroStatistic from './HeroStatistic';
import { EDeveloperLandingSection } from '../utils/eventUtils';
import useDeveloperLandingSectionImpression from '../utils/useDeveloperLandingSectionImpression';

const useStyles = makeStyles()((theme) => ({
  heroContainer: {
    height: '85vh',
    width: '100vw',
    position: 'relative',
    padding: `0px ${DEVELOPER_LANDING_HORIZONTAL_PADDING.compact}px`,
    minHeight: 520,
    minWidth: 250,
    [theme.breakpoints.up('Medium')]: {
      paddingTop: topNavigationHeights.compact,
      height: '90vh',
      minHeight: 560,
    },
    [theme.breakpoints.up('Large')]: {
      paddingLeft: 50,
      minHeight: 670,
    },
    [theme.breakpoints.up('XLarge')]: {
      paddingLeft: 80,
    },
    marginBottom: 20,
  },
  heroContentContainer: {
    height: '100%',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 40,
  },
  heroTitle: {
    lineHeight: '110%',
    fontWeight: 450,
    maxWidth: 450,
    [theme.breakpoints.up('Medium')]: {
      fontSize: 60,
      maxWidth: 620,
    },
    [theme.breakpoints.up('Large')]: {
      fontSize: 65,
      maxWidth: 900,
    },
  },
  heroVideo: {
    height: '100%',
    width: '100%',
    objectFit: 'cover',
    position: 'absolute',
    opacity: 0.5,
    top: 0,
    left: 0,
  },
  verticalDivider: {
    alignSelf: 'center',
    height: 60,
    borderColor: alpha(theme.palette.content.static.light, 51),
    margin: '0 5px',
  },

  heroStatisticsRowContainer: {
    width: '100%',
    maxWidth: 700,
  },

  disclaimer: {
    position: 'relative',
    bottom: 30,
    paddingRight: 20,
    opacity: 0.8,
  },
}));

const Hero: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const { translate, translateHTML } = useTranslation();
  const {
    classes: {
      heroTitle,
      heroContainer,
      heroContentContainer,
      heroStatisticsRowContainer,
      heroVideo,
      verticalDivider,
      disclaimer,
    },
  } = useStyles();

  const sectionRef = React.useRef<HTMLDivElement>(null);
  useDeveloperLandingSectionImpression(sectionRef, EDeveloperLandingSection.Hero);

  const isSm = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  return (
    <Flex
      classes={{ root: heroContainer }}
      justifyContent='flex-start'
      alignItems='flex-start'
      flexDirection='column'
      ref={sectionRef}>
      <video className={heroVideo} autoPlay loop muted playsInline poster={heroBackgroundPoster}>
        {heroBackgroundVideoSources.map(({ url, type }) => (
          <source src={url} type={type} key={type} />
        ))}
      </video>
      <div className={heroContentContainer}>
        <Typography classes={{ root: heroTitle }} variant='h1'>
          {translate('Heading.Hero')}
        </Typography>
        <Flex
          classes={{ root: heroStatisticsRowContainer }}
          alignItems='flex-start'
          justifyContent='space-between'
          flexDirection='row'>
          <HeroStatistic
            statistic={translate('Label.NumberOfDailyActiveUsers')}
            description={translate('Description.DailyActiveUsers')}
          />
          <Divider flexItem classes={{ root: verticalDivider }} orientation='vertical' />
          <HeroStatistic
            statistic={translate('Label.NumberOfUsersOver13')}
            description={translateHTML('Description.UsersOver13', null, {
              linkBreak: isSm ? <br /> : '',
            })}
          />
          <Divider flexItem classes={{ root: verticalDivider }} orientation='vertical' />
          <HeroStatistic
            statistic={translate('Label.MoneyDeliveredToCreators')}
            description={translate('Description.DeliveredToCreators')}
          />
        </Flex>
      </div>
      <Typography className={disclaimer} variant='legalDisclaimer' color='secondary'>
        {translate('Description.DeliveredToCreatorsLegalDisclaimer')}
      </Typography>
    </Flex>
  );
};

export default Hero;
