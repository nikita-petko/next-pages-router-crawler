import { makeStyles, Button } from '@rbx/ui';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { getAuthorizationEndpoint } from '@modules/navigation/applicationAuthorization/services/appAuthDataService';
import { urls } from '@modules/miscellaneous/common';
import Section from './common/Section';
import { creatorHubConstants } from '../constants/contentConstants';
import TileCard from './common/TileCard';
import { EDeveloperLandingSection, captureDeveloperLandingEvent } from '../utils/eventUtils';

const useStyles = makeStyles()((theme) => ({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gridTemplateRows: 'repeat(2, 1fr)',
    gap: 20,
    paddingBottom: 60,
    [theme.breakpoints.down('XLarge')]: {
      gridTemplateColumns: 'repeat(2, 1fr)',
      gridTemplateRows: 'repeat(3, 1fr)',
    },
    [theme.breakpoints.down('Medium')]: {
      gridTemplateColumns: 'repeat(1, 1fr)',
      gridTemplateRows: 'repeat(6, 1fr)',
    },
  },
  card: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  cardIcon: {
    marginRight: 15,
  },
  cardTitle: {
    paddingBottom: 5,
  },
  button: {
    margin: 'auto',
  },
}));

const CreatorHub: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const {
    classes: { grid, button },
  } = useStyles();

  const { translate } = useTranslation();

  const [loginUrl, setLoginUrl] = useState('');

  useEffect(() => {
    const getLoginUrl = async () => {
      const authUrl = await getAuthorizationEndpoint({
        state: 'developerLanding',
        redirectUri: `${process.env.baseUrl}${urls.creatorHub.getUrl()}`,
      });
      setLoginUrl(authUrl);
    };
    getLoginUrl();
  }, []);

  return (
    <Section
      backgroundVariant='short'
      title={translate('Heading.CreatorHub')}
      description={translate('Description.CreatorHub')}
      section={EDeveloperLandingSection.CreatorHub}>
      <div className={grid}>
        {creatorHubConstants.map(({ IconComponent, title, description, url, identifier }) => (
          <TileCard
            key={title}
            title={translate(title)}
            description={translate(description)}
            url={url}
            onClick={() =>
              captureDeveloperLandingEvent(
                'clickCreatorHubCard',
                EDeveloperLandingSection.CreatorHub,
                {
                  identifier,
                },
              )
            }
            IconComponent={IconComponent}
          />
        ))}
      </div>
      <Button
        component='a'
        href={loginUrl}
        onClick={() =>
          captureDeveloperLandingEvent('clickCreatorHubSignUp', EDeveloperLandingSection.CreatorHub)
        }
        classes={{ root: button }}
        variant='outlined'
        color='primary'>
        {translate('Action.SignUpOnCreatorHub')}
      </Button>
    </Section>
  );
};
export default CreatorHub;
