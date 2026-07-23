import type { FunctionComponent } from 'react';
import React from 'react';
import { Button } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { alpha, makeStyles, Typography, Divider, useMediaQuery } from '@rbx/ui';
import { Flex } from '@modules/miscellaneous/components/Flex';
import { creatorHub } from '@modules/miscellaneous/urls';
import { topNavigationHeights } from '@modules/navigation/layout/components/Layout.styles';
import { heroBackgroundImage } from '../constants/assetConstants';
import { EDeveloperLandingSection } from '../utils/eventUtils';
import useDeveloperLandingSectionImpression from '../utils/useDeveloperLandingSectionImpression';
import { DEVELOPER_LANDING_HORIZONTAL_PADDING } from './DeveloperContainer.styles';
import HeroStatistic from './HeroStatistic';

const useStyles = makeStyles()((theme) => ({
  heroContainer: {
    height: '85vh',
    width: '100vw',
    position: 'relative',
    padding: `0px ${DEVELOPER_LANDING_HORIZONTAL_PADDING.compact}px`,
    minHeight: 520,
    maxHeight: 1200,
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
    lineHeight: '120%',
    fontWeight: 600,
    maxWidth: 450,
    [theme.breakpoints.down('Medium')]: {
      fontSize: 48,
    },
    [theme.breakpoints.up('Medium')]: {
      fontSize: 60,
      maxWidth: 620,
    },
    [theme.breakpoints.up('Large')]: {
      fontSize: 65,
      maxWidth: 900,
    },
  },
  heroBackground: {
    height: '100%',
    width: '100%',
    objectFit: 'cover',
    position: 'absolute',
    opacity: 0.65,
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

  heroCtaButton: {
    marginTop: 20,
  },
}));

const Hero: FunctionComponent<React.PropsWithChildren> = () => {
  const { translate, translateHTML } = useTranslation();
  const {
    classes: {
      heroTitle,
      heroContainer,
      heroContentContainer,
      heroStatisticsRowContainer,
      heroBackground,
      verticalDivider,
      heroCtaButton,
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
      <img className={heroBackground} src={heroBackgroundImage} alt='' />
      <div className={heroContentContainer}>
        <Typography classes={{ root: heroTitle }} variant='hero'>
          {translate('Heading.Hero')}
        </Typography>
        <Flex
          classes={{ root: heroStatisticsRowContainer }}
          alignItems='flex-start'
          justifyContent='space-between'
          flexDirection='row'>
          <HeroStatistic
            statistic={translate('Label.NumberOfDailyActiveUsersV2')}
            description={translate('Description.DailyActiveUsers')}
          />
          <Divider flexItem classes={{ root: verticalDivider }} orientation='vertical' />
          <HeroStatistic
            statistic={translate('Label.PayedToCreators')}
            description={translateHTML('Description.PayedToCreators', null, {
              linkBreak: isSm ? <br /> : '',
            })}
          />
          <Divider flexItem classes={{ root: verticalDivider }} orientation='vertical' />
          <HeroStatistic
            statistic={translate('Label.AverageEarnedTopCreators')}
            description={translate('Description.AverageEarnedTopCreators')}
          />
        </Flex>
        <Button
          className={heroCtaButton}
          as='a'
          href={creatorHub.dashboard.getUrl()}
          variant='Emphasis'
          size='Large'>
          {translate('Action.StartCreatingOnRoblox')}
        </Button>
      </div>
    </Flex>
  );
};

export default Hero;
