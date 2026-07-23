import type { ComponentProps, FC } from 'react';
import { useCallback, useMemo } from 'react';
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
import type { TranslationKey } from '@modules/analytics-translations/types';
import withNamespaceSwitchedTranslation from '@modules/analytics-translations/withNamespaceSwitchedTranslation';
import {
  analyticsBountyPayoutsNavigationItem,
  analyticsExperienceCreatorRewardsNavigationItem,
  analyticsImmersiveAdsNavigationItem,
  analyticsItemMonetizationAvatarItemsNavigationItem,
  analyticsItemMonetizationDeveloperProductsNavigationItem,
  analyticsItemMonetizationPassesNavigationItem,
  analyticsSubscriptionsNavigationItem,
} from '@modules/charts-generic/constants/analyticsNavigationItems';
import { useCreationsCustomSettings } from '@modules/creations/common/implementations/creationsCustomSettings';
import type CreationsCustomSettings from '@modules/creations/common/interfaces/CreationsCustomSettings';
import type { AnalyticsExperiencePermissions } from '@modules/experience-analytics-shared/hooks/useAnalyticsPermissions';
import { useAnalyticsExperiencePermissions } from '@modules/experience-analytics-shared/hooks/useAnalyticsPermissions';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { logMonetizationDiscoveryCardClick } from '@modules/experience-analytics-shared/logging/experienceAnalyticsUnifiedLogger';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import type { TSettings } from '@modules/settings/SettingsProvider/settingsHelpers';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import useMonetizationSubpageDiscoveryCardsStyles from './MonetizationSubpageDiscoveryCards.styles';

type AllowedIcons = FC<ComponentProps<typeof TokenIcon>>;

type FeatureSettings = TSettings &
  CreationsCustomSettings & { canConfigure: boolean } & Pick<
    AnalyticsExperiencePermissions,
    'userCanViewAnalyticsForUniverse' | 'userCanManageAnalyticsAlertForUniverse'
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
    getLink: creatorHub.dashboard.getMonetizationDeveloperProductsAnalyticsTabUrl,
    isEnabledOnSettings: (settings) =>
      (settings?.canConfigure ?? false) || (settings?.userCanViewAnalyticsForUniverse ?? false),
  },
  {
    key: 'passes',
    label: analyticsItemMonetizationPassesNavigationItem.title,
    Icon: ShieldIcon,
    getLink: creatorHub.dashboard.getMonetizationPassesAnalyticsTabUrl,
    isEnabledOnSettings: (settings) =>
      (settings?.canConfigure ?? false) || (settings?.userCanViewAnalyticsForUniverse ?? false),
  },
  {
    key: 'avatar-items',
    label: analyticsItemMonetizationAvatarItemsNavigationItem.title,
    Icon: StoreIcon,
    getLink: creatorHub.dashboard.getMonetizationAvatarItemsAnalyticsTabUrl,
    isEnabledOnSettings: (settings) =>
      (settings?.canConfigure ?? false) || (settings?.userCanViewAnalyticsForUniverse ?? false),
  },
  {
    key: 'immersive-ads',
    label: analyticsImmersiveAdsNavigationItem.title,
    Icon: ViewArrayIcon,
    getLink: creatorHub.dashboard.getMonetizationImmersiveAdsUrl,
    isEnabledOnSettings: (settings) => settings?.canConfigure ?? false,
  },
  {
    key: 'subscriptions',
    label: analyticsSubscriptionsNavigationItem.title,
    Icon: CurrencyExchangeIcon,
    getLink: creatorHub.dashboard.getMonetizationSubscriptionsAnalyticsTabUrl,
    isEnabledOnSettings: (settings) =>
      (settings?.canConfigure ?? false) || (settings?.userCanViewAnalyticsForUniverse ?? false),
  },
  {
    key: 'creator-rewards',
    label: analyticsExperienceCreatorRewardsNavigationItem.title,
    Icon: PaymentsIcon,
    getLink: creatorHub.dashboard.getMonetizationCreatorRewardsUrl,
    isEnabledOnSettings: (settings) => settings?.userCanViewAnalyticsForUniverse ?? false,
  },
  {
    key: 'bounty-payouts',
    label: analyticsBountyPayoutsNavigationItem.title,
    Icon: PaymentsIcon,
    getLink: creatorHub.dashboard.getMonetizationBountyPayoutsUrl,
    isEnabledOnSettings: (settings) => settings?.userCanViewAnalyticsForUniverse ?? false,
  },
];

const MonetizationSubpageDiscoveryCards = () => {
  const { translate } = useRAQIV2TranslationDependencies();
  const { id: universeId } = useUniverseResource();

  const { settings } = useSettings();
  const creationsCustomSettings = useCreationsCustomSettings();
  const { canConfigure } = useCurrentGame();
  const { userCanViewAnalyticsForUniverse, userCanManageAnalyticsAlertForUniverse } =
    useAnalyticsExperiencePermissions(universeId);
  const mergedSettings = useMemo(
    () => ({
      ...settings,
      ...creationsCustomSettings,
      userCanViewAnalyticsForUniverse,
      userCanManageAnalyticsAlertForUniverse,
      canConfigure: canConfigure ?? false,
    }),
    [
      canConfigure,
      creationsCustomSettings,
      settings,
      userCanManageAnalyticsAlertForUniverse,
      userCanViewAnalyticsForUniverse,
    ],
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
