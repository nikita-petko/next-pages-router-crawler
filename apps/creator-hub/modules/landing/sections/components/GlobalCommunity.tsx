import React, { FunctionComponent } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Grid, Typography, Card } from '@rbx/ui';
import { globalNetworkPath, avatarProfilesPath } from '../constants/assetConstants';

import useGlobalCommunityStyles from './GlobalCommunity.styles';

const GlobalCommunity: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const { translate } = useTranslation();
  const {
    classes: {
      root,
      tooltip,
      description,
      avatarsImg,
      globalNetworkImg,
      publishDescription,
      informationContainer,
      avatarContainer,
    },

    cx,
  } = useGlobalCommunityStyles();

  return (
    <Grid className={root} container>
      <Grid>
        <img
          className={globalNetworkImg}
          src={globalNetworkPath}
          alt={translate('Label.Network')}
        />
      </Grid>
      <Grid
        className={informationContainer}
        container
        direction='column'
        justifyContent='space-between'>
        <Grid item container direction='column' wrap='nowrap'>
          <Typography variant='h3' component='h3'>
            {translate('Heading.PublishInstantly')}
          </Typography>
          <Typography
            className={cx(description, publishDescription)}
            variant='body1'
            color='secondary'>
            {translate('Description.ReachWithTranslation')}
          </Typography>
        </Grid>
        <Grid className={avatarContainer} container direction='row' wrap='nowrap'>
          <Grid className={avatarsImg} item>
            <img src={avatarProfilesPath} alt={translate('Label.Avatars')} />
            <Card classes={{ root: tooltip }}>
              <Typography variant='body1'>{translate('Label.AnneShoemakerQuote')} </Typography>
              <br />
              <Typography color='secondary' variant='body1' italics>
                Anne Shoemaker
              </Typography>
            </Card>
          </Grid>
          <Grid container direction='column'>
            <Typography variant='h3' component='h3' align='right'>
              {translate('Heading.JoinCreatorCommunity')}
            </Typography>
            <Typography className={description} variant='body1' color='secondary' align='right'>
              {translate('Description.CollaborateDiverseNetwork')}
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default withTranslation(GlobalCommunity, [TranslationNamespace.Landing]);
