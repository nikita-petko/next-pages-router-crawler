import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Typography, useMediaQuery, makeStyles, RobloxIcon, Link } from '@rbx/ui';
import { Flex } from '@modules/miscellaneous/components';
import { www } from '@modules/miscellaneous/urls';
import { communityConstants } from '../constants/contentConstants';
import { captureDeveloperLandingEvent, EDeveloperLandingSection } from '../utils/eventUtils';
import { developerLandingLinkActionColor } from './common/Card';
import Section from './common/Section';

const breakSize = 'XLarge';

const useStyles = makeStyles()((theme) => ({
  panelContainer: {
    width: '100%',
    marginBottom: 120,
    [theme.breakpoints.down(breakSize)]: {
      marginBottom: 150,
    },
    [theme.breakpoints.down('Medium')]: {
      marginBottom: 75,
    },
  },
  panel: {
    width: 'calc(40% - 72px)',
    marginTop: 'auto',
    marginBottom: 'auto',
    [theme.breakpoints.down(breakSize)]: {
      width: '100%',
    },
  },
  videoContainer: {
    width: '60%',
    [theme.breakpoints.down(breakSize)]: {
      width: '100%',
      marginBottom: 40,
    },
  },
  video: {
    width: '100%',
    height: 'auto',
    position: 'relative',
    paddingTop: '56.25%',
    '& > iframe': {
      ...theme.border.radius.medium,
      position: 'absolute',
      left: 0,
      top: 0,
      height: '100%',
      width: '100%',
      border: 'none',
    },
  },
  name: {
    fontSize: '40px',
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: '110%',
    [theme.breakpoints.down(breakSize)]: {
      fontSize: '24px',
    },
  },
  username: {
    color: developerLandingLinkActionColor,
    paddingTop: 4,
    '& > svg': { paddingRight: 4 },
  },
  description: {
    paddingTop: 20,
  },
  lastChild: {
    marginBottom: 0,
  },
  robloxLogo: {
    height: 18,
    width: 18,
  },
}));

const Community: FunctionComponent<React.PropsWithChildren> = () => {
  const {
    classes: {
      videoContainer,
      video: videoRoot,
      panelContainer,
      panel,
      name: nameRoot,
      username: usernameRoot,
      description,
      lastChild,
      robloxLogo,
    },

    cx,
  } = useStyles();

  const { translate } = useTranslation();

  const isSm = useMediaQuery((theme) => theme.breakpoints.down(breakSize));

  return (
    <Section
      title={translate('Heading.ThrivingCommunity')}
      backgroundVariant='short'
      section={EDeveloperLandingSection.Community}>
      {communityConstants.map(({ video, name, userId, username, quote }, index) => (
        <Flex
          key={name}
          classes={{
            root: cx(panelContainer, {
              [lastChild]: index === communityConstants.length - 1,
            }),
          }}
          flexDirection={index % 2 === 0 ? 'row' : 'row-reverse'}
          flexWrap='wrap'
          justifyContent={isSm ? 'center' : 'space-between'}>
          <div className={videoContainer}>
            <div className={videoRoot}>
              <iframe
                width='560'
                height='315'
                src={video}
                title='YouTube video player'
                allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
                loading='lazy'
              />
            </div>
          </div>
          <Flex classes={{ root: panel }}>
            <Flex flexDirection='column'>
              <Typography classes={{ root: nameRoot }}>{name}</Typography>
              <Flex alignItems='center' classes={{ root: usernameRoot }}>
                <RobloxIcon className={robloxLogo} color='inherit' />
                <Link
                  href={www.getUserUrl(userId)}
                  variant='inherit'
                  color='inherit'
                  onClick={() =>
                    captureDeveloperLandingEvent(
                      'clickCommunityCreator',
                      EDeveloperLandingSection.Community,
                      {
                        username,
                      },
                    )
                  }>
                  {username}
                </Link>
              </Flex>
              <Typography classes={{ root: description }} color='secondary'>
                {translate(quote)}
              </Typography>
            </Flex>
          </Flex>
        </Flex>
      ))}
    </Section>
  );
};
export default Community;
