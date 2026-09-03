import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, Typography } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { studioImagePath } from '../constants/assetConstants';
import useStudioOverviewStyles from './StudioOverview.styles';

const Experiences: FunctionComponent<React.PropsWithChildren> = () => {
  const { translate } = useTranslation();
  const {
    classes: { root, heading, video, informationContainer, information },
  } = useStudioOverviewStyles();

  return (
    <Grid className={root} container justifyContent='center'>
      <Grid className={heading} item>
        <Typography variant='h3' component='h3' align='center'>
          {translate('Heading.EverythingYouNeed')}
        </Typography>
      </Grid>
      <img className={video} src={studioImagePath} alt={translate('Heading.RobloxStudioEngine')} />
      <Grid className={informationContainer}>
        <Grid className={information} id='robloxStudioEngine'>
          <Typography variant='h5' component='h5'>
            {translate('Heading.RobloxStudioEngine')}
          </Typography>
          <Typography variant='body1'>{translate('Description.BringVisionToLife')}</Typography>
        </Grid>
        <Grid className={information} id='rapidIteration'>
          <Typography variant='h5' component='h5'>
            {translate('Heading.RapidIteration')}
          </Typography>
          <Typography variant='body1'>{translate('Description.RealTimeUpdates')}</Typography>
        </Grid>
        <Grid className={information} id='noUpfrontCosts'>
          <Typography variant='h5' component='h5'>
            {translate('Heading.NoUpfrontCosts')}
          </Typography>
          <Typography variant='body1'>{translate('Description.FreeEndToEndCreation')}</Typography>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default withTranslation(Experiences, [
  TranslationNamespace.Landing,
  TranslationNamespace.Creations,
]);
