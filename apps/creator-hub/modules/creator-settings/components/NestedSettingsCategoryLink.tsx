import { NavigateNextIcon, Grid, Typography, Divider } from '@rbx/ui';
import React, { FunctionComponent } from 'react';
import useNotificationsSettingsCategoryLinkStyles from '../notifications-settings/home/NotificationsSettingsCategoryLink.styles';

type NestedSettingsCategoryLinkProps = {
  categoryKey: string;
  categoryFriendlyKey: string;
  categoryDescription: string;
  onClick: () => void;
  divider: boolean;
};

const NestedSettingsCategoryLink: FunctionComponent<
  React.PropsWithChildren<NestedSettingsCategoryLinkProps>
> = ({ categoryFriendlyKey, categoryKey, onClick, divider, categoryDescription }) => {
  const { classes: styles } = useNotificationsSettingsCategoryLinkStyles();
  return (
    <React.Fragment>
      <Grid
        container
        data-testid={`category-link-${categoryKey}`}
        direction='row'
        key={categoryKey}
        onClick={onClick}
        className={styles.container}>
        <Grid className={styles.leftContent} zeroMinWidth>
          <Typography variant='h4' display='block' noWrap>
            {categoryFriendlyKey}
          </Typography>
          {categoryDescription && (
            <Typography
              className={`${styles.subtext}`}
              variant='body1'
              color='secondary'
              display='block'>
              {categoryDescription}
            </Typography>
          )}
        </Grid>

        {/* TODO: (@asun 06/16/23) https://roblox.atlassian.net/browse/CRF-3285 translate aria-labels} */}
        <Grid className={styles.rightContent}>
          <NavigateNextIcon color='secondary' />
        </Grid>
      </Grid>
      {divider && <Divider />}
    </React.Fragment>
  );
};

export default NestedSettingsCategoryLink;
