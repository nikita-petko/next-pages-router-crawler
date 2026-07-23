import { Grid, Typography, useMediaQuery } from '@rbx/ui';
import React, { CSSProperties, FunctionComponent, useMemo } from 'react';
import { useTranslation, Locale, useLocalization } from '@rbx/intl';
import LazyLoadedVideo from './LazyLoadedVideo';
import useRewardsHeroUnitStyles from './RewardsHeroUnit.styles';

const LOCALES_WITH_LONG_TITLES = new Set([
  Locale.German,
  Locale.Spanish,
  Locale.French,
  Locale.Italian,
  Locale.Vietnamese,
  Locale.Japanese,
]);
const LOCALES_FOR_LARGER_LINE_HEIGHT = new Set([
  Locale.SimplifiedChineseJV,
  Locale.SimplifiedChinese,
  Locale.TraditionalChinese,
  Locale.Japanese,
  Locale.Korean,
]);

const RewardsHeroUnit: FunctionComponent = () => {
  const { translate } = useTranslation();
  const { locale } = useLocalization();
  // The hero unit normally features the name split around a hero image. If the localization only has one word
  // or the screen is too small, then the text will be displayed below the hero image instead
  const heroString = translate('Title.HeroTitle', { image: '<split>' }).toUpperCase();
  const splitHeroString = heroString.split('<SPLIT>').filter((fragment) => fragment !== '');
  const useCentered =
    useMediaQuery((theme) => theme.breakpoints.down('Large')) || splitHeroString.length < 2;
  const useCompactStyles = useMediaQuery((theme) => theme.breakpoints.down('Medium'));

  const { classes } = useRewardsHeroUnitStyles();

  const heroTextStyle = useMemo(() => {
    const effectiveLocale = locale ?? Locale.English;
    const textStyle: CSSProperties = {};
    if (useCompactStyles) {
      textStyle.fontSize = LOCALES_WITH_LONG_TITLES.has(effectiveLocale) ? 42 : 58;
    }
    if (!LOCALES_FOR_LARGER_LINE_HEIGHT.has(effectiveLocale)) {
      textStyle.lineHeight = '90%';
    }
    return textStyle;
  }, [locale, useCompactStyles]);

  return (
    <Grid gap={100}>
      {useCentered ? (
        <Grid className={classes.centeredTextHeroContainer} display='flex' direction='column'>
          <Grid marginBottom='-100px'>
            <img
              className={classes.heroImage}
              alt=''
              src={`${process.env.assetPathPrefix}/creatorRewardsLanding/00_hero_art.png`}
            />
          </Grid>
          <Typography style={heroTextStyle} variant='hero'>
            {splitHeroString[0]}
          </Typography>
          {splitHeroString.length > 1 && (
            <Typography variant='hero' style={heroTextStyle}>
              {splitHeroString[1]}
            </Typography>
          )}
        </Grid>
      ) : (
        <Grid className={classes.heroContainer}>
          <Typography style={heroTextStyle} variant='hero'>
            {splitHeroString[0]}
          </Typography>
          <img
            className={classes.heroImage}
            alt=''
            src={`${process.env.assetPathPrefix}/creatorRewardsLanding/00_hero_art.png`}
          />
          <Typography style={heroTextStyle} variant='hero'>
            {splitHeroString[1]}
          </Typography>
        </Grid>
      )}
      <div className={classes.videoContainer}>
        <LazyLoadedVideo
          classes={{ root: classes.video }}
          src={[
            {
              url: `${process.env.assetPathPrefix}/creatorRewardsLanding/wave_background_short.mp4`,
              type: 'video/mp4',
            },
            {
              url: `${process.env.assetPathPrefix}/creatorRewardsLanding/wave_background_short.webm`,
              type: 'video/webm',
            },
          ]}
          poster={`${process.env.assetPathPrefix}/creatorRewardsLanding/wave_background_short.webp`}
        />
      </div>
    </Grid>
  );
};

export default RewardsHeroUnit;
