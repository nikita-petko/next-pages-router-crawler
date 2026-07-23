import type { ReactElement } from 'react';
import { Grid, Typography, useMediaQuery } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import WatchlistExperienceUrlInput from './WatchlistExperienceUrlInput';
import useWatchlistZeroStateStyles from './WatchlistZeroState.styles';

const WatchlistZeroState = (): ReactElement => {
  const { translate } = useRAQIV2TranslationDependencies();
  const {
    classes: { grid, watchlistImage, watchlistImageContainer },
  } = useWatchlistZeroStateStyles();
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));

  return (
    <Grid container direction='row' justifyContent='space-between' className={grid}>
      <Grid
        item
        Large={6}
        Medium={12}
        container
        direction='column'
        justifyContent='center'
        alignItems='flex-start'
        spacing={2}>
        <Grid item>
          <Typography variant='h3'>
            {translate(translationKey('Heading.AddExperiences', TranslationNamespace.Analytics))}
          </Typography>
        </Grid>
        <Grid item width='100%'>
          <WatchlistExperienceUrlInput />
        </Grid>
      </Grid>
      {!isCompactView && (
        <Grid Large={6} Medium={12} item className={watchlistImageContainer}>
          <img
            className={watchlistImage}
            src={`${process.env.assetPathPrefix}/analytics/WatchlistZeroState.png`}
            alt='watchlist zero state'
          />
        </Grid>
      )}
    </Grid>
  );
};

export default WatchlistZeroState;
