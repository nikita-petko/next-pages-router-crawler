import {
  NavigationTree,
  NavigationTreeItem,
  useRailContext,
  useWorkspaces,
} from '@rbx/creator-hub-navigation';
import { Badge, Divider } from '@rbx/foundation-ui';
import { makeStyles } from '@rbx/ui';
import { useRouter } from 'next/router';
import { useCallback, useMemo } from 'react';

import { EventName, logNativeClickEvent } from '@clients/unifiedLogger';
import DismissibleTooltip from '@components/common/DismissibleTooltip';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import { Tooltips } from '@constants/tooltips';
import { useForecastEstimatorDrawerUrl } from '@hooks/useForecastEstimatorDrawerUrl';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { getSelectedGroupId } from '@utils/groupScopedAccount';

const useStyles = makeStyles()(() => ({
  // Pinned to the bottom of the rail via `marginTop: auto`. The flex
  // column + gap matches the parent `container` spacing so the Divider
  // above Resources sits with the same breathing room as the other
  // section dividers.
  additionalLinks: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginTop: 'auto',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    height: '100%',
  },
  // Matches creator-hub-navigation All Tools / NavigationTreeItem row chrome:
  // full-width 40px row, label grows, trailing adornment pinned right.
  header: {
    alignItems: 'center',
    boxSizing: 'border-box',
    display: 'flex',
    height: 40,
    minHeight: 40,
    // Right inset matches creator-hub itemBox (`padding: 0 12px 0 0`); left
    // inset keeps the heading aligned with tree item labels below.
    paddingLeft: 12,
    paddingRight: 12,
    width: '100%',
  },
  headerLabel: {
    color: 'var(--color-content-emphasis)',
    flex: '1 1 0',
    minWidth: 0,
  },
  // Same trailing slot as creator-hub-navigation (`trailing` on nav rows /
  // All Tools items): 24px tall, 8px gap from the label, right-aligned.
  headerTrailing: {
    alignItems: 'center',
    display: 'flex',
    flexShrink: 0,
    gap: 4,
    height: 24,
    justifyContent: 'flex-end',
    paddingLeft: 8,
  },
}));

// Maps a `next/router` pathname to the matching NavigationTreeItem nodeId so
// the rail highlights the current page on direct landing (the underlying
// NavigationTree is otherwise uncontrolled and only updates selection on
// click). Order matters: more specific prefixes must come first.
const PATHNAME_TO_NODE_ID: ReadonlyArray<readonly [string, string]> = [
  [Routes.MANAGE, 'campaigns.ads'],
  [Routes.CLASSIC, 'campaigns.adsClassic'],
  [Routes.AD_INTEGRATIONS, 'adIntegrations'],
  [Routes.CREATIVE_LIBRARY, 'assetLibrary'],
  [Routes.PAYMENT_SETTINGS, 'billing.paymentSettings'],
  // Add Payment Method is launched from Payment Settings; keep that item
  // highlighted so the rail reflects the in-flight billing workflow.
  [Routes.ADD_PAYMENT, 'billing.paymentSettings'],
  [Routes.PAYMENT_ACTIVITY, 'billing.paymentActivity'],
  [Routes.ACCOUNT_OVERVIEW, 'accountOverview'],
];

const getSelectedNodeId = (pathname: string): string => {
  const match = PATHNAME_TO_NODE_ID.find(
    ([route]) => pathname === route || pathname.startsWith(`${route}/`),
  );
  return match ? match[1] : '';
};

const resourceRows = [
  {
    href: 'https://create.roblox.com/docs/production/promotion/ads-manager',
    nodeId: 'resources.adsManagerHelp',
    translationKey: 'Label.AdsManagerHelp',
  },
  {
    href: 'https://en.help.roblox.com/hc/en-us/articles/13722260778260',
    nodeId: 'resources.advertisingStandards',
    translationKey: 'Label.AdvertisingStandards',
  },
];

const NavigationRail = () => {
  const { translate: translateNavigation } = useNamespacedTranslation(
    TranslationNamespace.Navigation,
  );
  const { translate: translateAccount } = useNamespacedTranslation(TranslationNamespace.Account);
  // `Label.Beta` lives in Campaign (same key used by objective / AI Create badges).
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { translate: translateCreatorNav } = useNamespacedTranslation(
    TranslationNamespace.CreatorDashboardNavigation,
  );
  const { translate: translateForecast } = useNamespacedTranslation(TranslationNamespace.Forecast);
  const {
    classes: { additionalLinks, container, header, headerLabel, headerTrailing },
    cx,
  } = useStyles();

  const isAdIntegrationsEnabled = useAppStore(
    (state: AppStoreType) => state.appMetadataState?.data?.isAdIntegrationsEnabled,
  );

  const accountIsInternal = useAppStore((state: AppStoreType) =>
    state.adAccountIsInternalManaged(),
  );
  const accountIsManaged = useAppStore((state: AppStoreType) => state.adAccountIsExternalManaged());

  const isPaymentsPagesForLOCEnabled = useAppStore(
    (state: AppStoreType) => state.appMetadataState?.data?.isPaymentsPagesForLOCEnabled,
  );
  const isAdAccountAutoCreateEnabled = useAppStore(
    (state: AppStoreType) => state.appMetadataState?.data?.isAdAccountAutoCreateEnabled ?? false,
  );
  const hasAdAccount = !!useAppStore((state: AppStoreType) => state.appData.adAccountId);
  const userAdvertiserState = useAppStore((state: AppStoreType) => state.advertiserState);
  const userAdvertiserLoaded =
    userAdvertiserState?.data != null &&
    !userAdvertiserState.isError &&
    !userAdvertiserState.isLoading;
  const hideForAutoCreate = isAdAccountAutoCreateEnabled && !hasAdAccount;
  const { currentWorkspace, isLoading: isWorkspaceLoading, workspaces } = useWorkspaces();
  const workspaceResolved =
    !isAdAccountAutoCreateEnabled ||
    (!isWorkspaceLoading && currentWorkspace != null && workspaces != null);
  const selectedGroupId = getSelectedGroupId(currentWorkspace, isAdAccountAutoCreateEnabled);
  const selectedGroupScopedAccountState = useAppStore((state: AppStoreType) =>
    selectedGroupId ? state.groupScopedAccountStateByGroupId?.[selectedGroupId] : undefined,
  );
  const selectedGroupAdvertiserState = selectedGroupScopedAccountState?.advertiserState;
  const selectedGroupAdvertiserLoaded =
    selectedGroupAdvertiserState?.data != null &&
    !selectedGroupAdvertiserState.isError &&
    !selectedGroupAdvertiserState.isLoading;
  const showBillingAndAccountNavigation =
    workspaceResolved &&
    (selectedGroupId == null ? userAdvertiserLoaded : selectedGroupAdvertiserLoaded);

  const showPaymentsOptions =
    !hideForAutoCreate &&
    ((!accountIsManaged && !accountIsInternal) || isPaymentsPagesForLOCEnabled);

  const isForecastEstimatorEnabled = useAppStore(
    (s) => s.appMetadataState?.data?.isForecastEstimatorEnabled ?? false,
  );
  const { isOpen: isForecastEstimatorOpen, open: openForecastEstimator } =
    useForecastEstimatorDrawerUrl();
  const { drawerVariant, setPrimaryRailOpen } = useRailContext();

  const { pathname } = useRouter();
  const selectedNodeId = useMemo(() => getSelectedNodeId(pathname), [pathname]);

  // The nav-rail coachmark points users *to* the Creative Library link, so it
  // only makes sense before they land there. Suppressing it on the Creative
  // Library route also frees the single tooltip slot so the AI-generate
  // coachmark on that page can take its turn (see useTooltipSelectionSlot).
  const isOnCreativeLibrary =
    pathname === Routes.CREATIVE_LIBRARY || pathname.startsWith(`${Routes.CREATIVE_LIBRARY}/`);

  const onForecastEstimatorClick = useCallback(() => {
    logNativeClickEvent(EventName.ForecastEstimatorDrawerOpenedFromNavRail);
    openForecastEstimator();
    if (drawerVariant === 'temporary') {
      setPrimaryRailOpen(false);
    }
  }, [drawerVariant, openForecastEstimator, setPrimaryRailOpen]);

  return (
    <div className={container}>
      <div className={header}>
        <span className={cx(headerLabel, 'text-label-large')}>
          {translateCreatorNav('Heading.AdsManager')}
        </span>
        <span className={headerTrailing}>
          <Badge label={translateCampaign('Label.Beta')} size='XSmall' />
        </span>
      </div>
      <Divider />
      <NavigationTree defaultExpanded={['campaigns']} selected={selectedNodeId}>
        <NavigationTreeItem
          label={translateNavigation('Label.Campaigns')}
          nodeId='campaigns'
          variant='smallLabel2'>
          <NavigationTreeItem
            href={Routes.MANAGE}
            label={translateNavigation('Label.ManageAds')}
            nodeId='campaigns.ads'
          />
          {!hideForAutoCreate && (
            <NavigationTreeItem
              href={Routes.CLASSIC}
              label={translateNavigation('Label.ManageAdsClassic')}
              nodeId='campaigns.adsClassic'
            />
          )}
        </NavigationTreeItem>
        <DismissibleTooltip
          anchorElement={
            <NavigationTreeItem
              adornment={<Badge label={translateNavigation('Label.New')} />}
              href={Routes.CREATIVE_LIBRARY}
              label={translateNavigation('Label.CreativeLibrary')}
              nodeId='assetLibrary'
              variant='smallLabel2'
            />
          }
          // Clicking through to the Asset Library means the user has found it,
          // so retire the coachmark instead of waiting for the OK button.
          dismissOnAnchorClick
          // Suppress while the rail is collapsed so the beak doesn't point at a
          // hidden anchor (mirrors the forecaster coachmark below), and while
          // the user is already on the Creative Library page.
          enabled={drawerVariant === 'persistent' && !isOnCreativeLibrary}
          tooltip={Tooltips.CREATIVE_LIBRARY_NAV}
        />
        {isAdIntegrationsEnabled && (
          <NavigationTreeItem
            href={Routes.AD_INTEGRATIONS}
            label={translateAccount('Label.AdIntegrations')}
            nodeId='adIntegrations'
            variant='smallLabel2'
          />
        )}
      </NavigationTree>
      {showBillingAndAccountNavigation ? (
        <>
          {(showPaymentsOptions || !hideForAutoCreate) && <Divider />}
          <NavigationTree defaultExpanded={['billing']} selected={selectedNodeId}>
            {showPaymentsOptions && (
              <NavigationTreeItem
                label={translateNavigation('Label.BillingAndPayments')}
                nodeId='billing'
                variant='smallLabel2'>
                <NavigationTreeItem
                  href={Routes.PAYMENT_SETTINGS}
                  label={translateNavigation('Label.PaymentSettings')}
                  nodeId='billing.paymentSettings'
                />
                <NavigationTreeItem
                  href={Routes.PAYMENT_ACTIVITY}
                  label={translateNavigation('Label.PaymentActivity')}
                  nodeId='billing.paymentActivity'
                />
              </NavigationTreeItem>
            )}
            {!hideForAutoCreate && (
              <NavigationTreeItem
                href={Routes.ACCOUNT_OVERVIEW}
                label={translateNavigation('Label.AccountOverview')}
                nodeId='accountOverview'
                variant='smallLabel2'
              />
            )}
          </NavigationTree>
        </>
      ) : null}
      <div className={additionalLinks}>
        <Divider />
        <NavigationTree
          defaultExpanded={['resources']}
          selected={isForecastEstimatorOpen ? 'resources.forecaster' : ''}>
          <NavigationTreeItem
            label={translateNavigation('Label.Resources')}
            nodeId='resources'
            variant='smallLabel2'>
            {isForecastEstimatorEnabled && (
              <DismissibleTooltip
                anchorElement={
                  <NavigationTreeItem
                    data-testid='forecast-estimator-open-button'
                    label={translateForecast('Title.CampaignForecaster')}
                    nodeId='resources.forecaster'
                    onClick={onForecastEstimatorClick}
                  />
                }
                enabled={drawerVariant === 'persistent'}
                tooltip={Tooltips.CAMPAIGN_FORECASTER}
              />
            )}
            {resourceRows.map(({ href, nodeId, translationKey }) => (
              <NavigationTreeItem
                href={href}
                key={nodeId}
                label={translateNavigation(translationKey)}
                nodeId={nodeId}
              />
            ))}
          </NavigationTreeItem>
        </NavigationTree>
      </div>
    </div>
  );
};

export default NavigationRail;
