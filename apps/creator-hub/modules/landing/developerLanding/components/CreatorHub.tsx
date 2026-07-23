import type { FunctionComponent } from 'react';
import React, { useEffect, useState } from 'react';
import { Button } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { makeStyles } from '@rbx/ui';
import { creatorHub } from '@modules/miscellaneous/urls';
import { getAuthorizationEndpoint } from '@modules/navigation/applicationAuthorization/services/appAuthDataService';
import { creatorHubConstants } from '../constants/contentConstants';
import { EDeveloperLandingSection, captureDeveloperLandingEvent } from '../utils/eventUtils';
import Section from './common/Section';
import TileCard from './common/TileCard';

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

const CreatorHub: FunctionComponent<React.PropsWithChildren> = () => {
  const {
    classes: { grid, button },
  } = useStyles();

  const { translate } = useTranslation();

  const [loginUrl, setLoginUrl] = useState('');

  useEffect(() => {
    const getLoginUrl = async () => {
      const authUrl = await getAuthorizationEndpoint({
        state: 'developerLanding',
        redirectUri: `${process.env.baseUrl}${creatorHub.getUrl()}`,
      });
      setLoginUrl(authUrl);
    };
    void getLoginUrl();
  }, []);

  return (
    <Section
      backgroundVariant='short'
      title={translate('Heading.CreatorHubSection')}
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
        as='a'
        href={loginUrl}
        onClick={() =>
          captureDeveloperLandingEvent('clickCreatorHubSignUp', EDeveloperLandingSection.CreatorHub)
        }
        className={button}
        variant='Standard'
        size='Large'>
        {translate('Action.GoToCreatorHub')}
      </Button>
    </Section>
  );
};
export default CreatorHub;
