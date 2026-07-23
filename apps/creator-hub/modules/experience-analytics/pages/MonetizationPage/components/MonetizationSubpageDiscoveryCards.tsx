import React, { FC, useCallback, useMemo } from 'react';
import {
  Card,
  CardActionArea,
  CurrencyExchangeIcon,
  Grid,
  IconButton,
  Link,
  PaymentsIcon,
  ShieldIcon,
  StoreIcon,
  TokenIcon,
  Typography,
  ViewArrayIcon,
} from '@rbx/ui';
import {
  analyticsExperienceCreatorRewardsNavigationItem,
  analyticsImmersiveAdsNavigationItem,
  analyticsItemMonetizationAvatarItemsNavigationItem,
  analyticsItemMonetizationDeveloperProductsNavigationItem,
  analyticsItemMonetizationPassesNavigationItem,
  analyticsSubscriptionsNavigationItem,
} from '@modules/charts-generic';
import { TranslationKey, withNamespaceSwitchedTranslation } from '@modules/analytics-translations';
import { urls } from '@modules/miscellaneous/common';
import { CreationsCustomSettings, useCreationsCustomSettings } from '@modules/creations';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { TSettings, useSettings } from '@modules/settings';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  logMonetizationDiscoveryCardClick,
  useRAQIV2TranslationDependencies,
  useUniverseResource,
} from '@modules/experience-analytics-shared';
import AnalyticsFlags from '@modules/feature-flags/analytics/flags';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { TFlag } from '@modules/feature-flags/types';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import useMonetizationSubpageDiscoveryCardsStyles from './MonetizationSubpageDiscoveryCards.styles';

type AllowedIcons = FC<React.ComponentProps<typeof TokenIcon>>;

type FeatureSettings = TSettings &
  CreationsCustomSettings & { canConfigure: boolean } & Record<
    TFlag<FeatureFlagNamespace.Analytics>,
    boolean
  >;

type TDiscoveryCardSpec = {
  key: string;
  label: TranslationKey;
  Icon: AllowedIcons;
  getLink: (universeId: number) => string;
  isEnabledOnSettings: (settings?: FeatureSettings) => boolean;
};

// TODO(shumingxu: 11/29/2023): Update icons once they are added to webblox in https://github.rbx.com/Roblox/web-blox/pull/543
const DiscoveryCardSpecs: TDiscoveryCardSpec[] = [
  {
    key: 'developer-products',
    label: analyticsItemMonetizationDeveloperProductsNavigationItem.title,
    Icon: TokenIcon,
    getLink: urls.creatorHub.dashboard.getMonetizationDeveloperProductsAnalyticsTabUrl,
    isEnabledOnSettings: (settings) =>
      (settings?.canConfigure || settings?.userCanViewAnalyticsForUniverse) ?? false,
  },
  {
    key: 'passes',
    label: analyticsItemMonetizationPassesNavigationItem.title,
    Icon: ShieldIcon,
    getLink: urls.creatorHub.dashboard.getMonetizationPassesAnalyticsTabUrl,
    isEnabledOnSettings: (settings) =>
      (settings?.canConfigure || settings?.userCanViewAnalyticsForUniverse) ?? false,
  },
  {
    key: 'avatar-items',
    label: analyticsItemMonetizationAvatarItemsNavigationItem.title,
    Icon: StoreIcon,
    getLink: urls.creatorHub.dashboard.getMonetizationAvatarItemsAnalyticsTabUrl,
    isEnabledOnSettings: (settings) =>
      (settings?.canConfigure || settings?.userCanViewAnalyticsForUniverse) ?? false,
  },
  {
    key: 'immersive-ads',
    label: analyticsImmersiveAdsNavigationItem.title,
    Icon: ViewArrayIcon,
    getLink: urls.creatorHub.dashboard.getMonetizationImmersiveAdsUrl,
    isEnabledOnSettings: (settings) =>
      (settings?.userCanViewAnalyticsForUniverse && settings?.isImmersiveAdsDashboardEnabled) ??
      false,
  },
  {
    key: 'subscriptions',
    label: analyticsSubscriptionsNavigationItem.title,
    Icon: CurrencyExchangeIcon,
    getLink: urls.creatorHub.dashboard.getMonetizationSubscriptionsAnalyticsTabUrl,
    isEnabledOnSettings: (settings) =>
      (settings?.canConfigure || settings?.userCanViewAnalyticsForUniverse) ?? false,
  },
  {
    key: 'creator-rewards',
    label: analyticsExperienceCreatorRewardsNavigationItem.title,
    Icon: PaymentsIcon,
    getLink: urls.creatorHub.dashboard.getMonetizationCreatorRewardsUrl,
    isEnabledOnSettings: (settings) => settings?.userCanViewAnalyticsForUniverse ?? false,
  },
];

const MonetizationSubpageDiscoveryCards = () => {
  const { translate } = useRAQIV2TranslationDependencies();
  const { id: universeId } = useUniverseResource();

  const { settings } = useSettings();
  const creationsCustomSettings = useCreationsCustomSettings();
  const { canConfigure } = useCurrentGame();
  const analyticsFlags = useFeatureFlagsForNamespace(
    AnalyticsFlags,
    FeatureFlagNamespace.Analytics,
  );
  const mergedSettings = useMemo(
    () => ({
      ...settings,
      ...creationsCustomSettings,
      ...analyticsFlags,
      canConfigure: canConfigure ?? false,
    }),
    [analyticsFlags, canConfigure, creationsCustomSettings, settings],
  );

  const enabledCards = useMemo(
    () => DiscoveryCardSpecs.filter((spec) => spec.isEnabledOnSettings(mergedSettings)),
    [mergedSettings],
  );

  const {
    classes: { cardHeight, iconMargin, textMargin, grid, linkNoUnderline },
  } = useMonetizationSubpageDiscoveryCardsStyles({
    cardsEnabled: enabledCards.length,
  });

  const { unifiedLogger } = useUnifiedLoggerProvider();

  const logCardClick = useCallback(
    (key: string) => {
      logMonetizationDiscoveryCardClick(unifiedLogger, { discoveryCardKey: key });
    },
    [unifiedLogger],
  );

  const cards = useMemo(
    () =>
      enabledCards.map((spec) => (
        <Grid item XSmall key={spec.key}>
          <Card className={cardHeight} onClick={() => logCardClick(spec.key)}>
            <Link href={spec.getLink(universeId)} color='inherit' className={linkNoUnderline}>
              <CardActionArea className={cardHeight}>
                <Grid container direction='column' justifyContent='top' alignItems='center'>
                  <Grid item>
                    <IconButton
                      size='medium'
                      color='default'
                      aria-label={spec.key}
                      className={iconMargin}>
                      <spec.Icon fontSize='medium' />
                    </IconButton>
                  </Grid>
                  <Grid item>
                    <Typography variant='body2' textAlign='center' className={textMargin}>
                      {translate(spec.label)}
                    </Typography>
                  </Grid>
                </Grid>
              </CardActionArea>
            </Link>
          </Card>
        </Grid>
      )),
    [
      cardHeight,
      enabledCards,
      iconMargin,
      linkNoUnderline,
      logCardClick,
      textMargin,
      translate,
      universeId,
    ],
  );

  return (
    <Grid container className={grid}>
      {cards}
    </Grid>
  );
};

export default withNamespaceSwitchedTranslation(MonetizationSubpageDiscoveryCards, [
  TranslationNamespace.Analytics,
  TranslationNamespace.AssetTypes,
  TranslationNamespace.AvatarAnalytics,
  TranslationNamespace.Navigation,
]);
