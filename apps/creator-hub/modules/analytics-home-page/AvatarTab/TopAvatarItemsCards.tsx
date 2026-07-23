import AvatarItemCardContent from '@modules/avatar-analytics/components/AvatarItemCardContent';
import { AnalyticsHeroItemCategory } from '@modules/experience-analytics-shared';
import { Grid } from '@rbx/ui';
import React, { FunctionComponent } from 'react';

const TopAvatarItemsCards: FunctionComponent = () => {
  return (
    <Grid container direction='row' spacing={2}>
      <Grid item>
        <AvatarItemCardContent topCategory={AnalyticsHeroItemCategory.TopSelling} />
      </Grid>
      <Grid item>
        <AvatarItemCardContent topCategory={AnalyticsHeroItemCategory.TopGrossing} />
      </Grid>
    </Grid>
  );
};

export default TopAvatarItemsCards;
