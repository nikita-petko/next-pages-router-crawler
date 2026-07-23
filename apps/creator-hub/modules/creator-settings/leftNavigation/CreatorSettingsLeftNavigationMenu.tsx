import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo, useContext } from 'react';
import Router, { useRouter } from 'next/router';
import type { CreatorNotificationCategory } from '@rbx/client-creator-settings/v1';
import { useFlag } from '@rbx/flags';
import { useTranslation, withTranslation } from '@rbx/intl';
import { showDevExO18LandingPage } from '@generated/flags/creatorBusiness';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import { notificationSettingsLeftNavEventModel } from '@modules/eventStream/constants/eventConstants';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import LeftNavigationMenuV2 from '@modules/navigation/leftNavigation/components/LeftNavigationMenuV2';
import { EligibilityType } from '../constants/eligibilityConstants';
import type { TCreatorNotificationsSettingsContext } from '../hooks/CreatorNotificationsSettingsContext';
import { CreatorNotificationsSettingsContext } from '../hooks/CreatorNotificationsSettingsContext';
import { getEligibilityNavigationSubitems } from '../hooks/getEligibilityNavigationSubitems';

const CreatorSettingsLeftNavigation: FunctionComponent<React.PropsWithChildren> = () => {
  const { translate } = useTranslation();
  const { value: showDevExO18LandingPageEnabled, ready: isDevExO18FlagReady } =
    useFlag(showDevExO18LandingPage);
  const { trackerClient } = useEventTrackerProvider();
  const router = useRouter();
  const { notificationSettings } = useContext<TCreatorNotificationsSettingsContext>(
    CreatorNotificationsSettingsContext,
  );
  const { params: ixpParams } = useIXPParameters(IXPLayers.CreatorDashboard);

  const { activeKey, defaultExpanded } = useMemo(() => {
    if ('notificationCategory' in router.query) {
      const category = router.query.notificationCategory;
      return {
        activeKey: `notifications/${Array.isArray(category) ? category[0] : category}`,
        defaultExpanded: ['parent-notifications'],
      };
    }
    if (router.pathname === '/settings/notifications') {
      return { activeKey: 'parent-notifications', defaultExpanded: [] };
    }
    if (router.pathname.startsWith('/settings/eligibility/')) {
      const page = router.pathname.split('/').pop();
      return { activeKey: `eligibility/${page}`, defaultExpanded: ['eligibility'] };
    }
    return { activeKey: router.pathname.split('/').pop() ?? '', defaultExpanded: [] };
  }, [router.query, router.pathname]);

  const handleSelectSettingKey = useCallback(
    (e: React.MouseEvent<HTMLLIElement>, key: string) => {
      e.preventDefault();
      e.stopPropagation();
      trackerClient.sendEvent(notificationSettingsLeftNavEventModel(activeKey, key));
      void Router.push(`/settings/${key}`);
    },
    [activeKey, trackerClient],
  );

  const menuItems = useMemo(() => {
    const preferencesTitle = translate('Title.Preferences');
    const notificationsTitle = translate('Title.Notifications');
    const webhooksTitle = translate('Label.WebhooksNav');
    const advancedTitle = translate('Header.Title');

    const notificationsSubitemsList = notificationSettings.flatMap(
      (setting: CreatorNotificationCategory) => {
        const categorySafeKey = translate(`Label.Category${setting.notificationCategoryName}`);
        const key = `notifications/${setting.notificationCategoryName}`;
        return {
          key,
          label: categorySafeKey,
          href: `/settings/${key}`,
          onClick: (e: React.MouseEvent<HTMLLIElement>) => handleSelectSettingKey(e, key),
          title: categorySafeKey,
          content: categorySafeKey,
        };
      },
    );

    const showDevExO18NavItem = isDevExO18FlagReady && (showDevExO18LandingPageEnabled ?? false);
    const eligibilityNavigationSubitems = getEligibilityNavigationSubitems(true).filter(
      (item) => showDevExO18NavItem || item.key !== EligibilityType.UsO18DevexRate,
    );
    const eligibilitySubitemsList = eligibilityNavigationSubitems.flatMap((setting) => {
      const key = `eligibility/${setting.key}`;
      return {
        key,
        label: translate(setting.title),
        href: `/settings/${key}`,
        onClick: (e: React.MouseEvent<HTMLLIElement>) => handleSelectSettingKey(e, key),
        title: translate(setting.title),
        content: translate(setting.content),
      };
    });

    const items = [
      {
        key: 'preferences',
        href: '/settings/preferences',
        label: preferencesTitle,
        onClick: (e: React.MouseEvent<HTMLLIElement>) => handleSelectSettingKey(e, 'preferences'),
        title: preferencesTitle,
        content: preferencesTitle,
      },
      {
        key: 'notifications',
        href: '/settings/notifications',
        label: notificationsTitle,
        onClick: (e: React.MouseEvent<HTMLLIElement>) => handleSelectSettingKey(e, 'notifications'),
        subItems: notificationsSubitemsList,
        title: notificationsTitle,
        content: notificationsTitle,
        isParentLink: true,
      },
      {
        key: 'webhooks',
        href: '/settings/webhooks',
        label: webhooksTitle,
        onClick: (e: React.MouseEvent<HTMLLIElement>) => handleSelectSettingKey(e, 'webhooks'),

        title: webhooksTitle,
        content: webhooksTitle,
      },
    ];

    items.push({
      key: 'eligibility',
      href: '/settings/eligibility',
      label: translate('Heading.Eligibility'),
      onClick: (e: React.MouseEvent<HTMLLIElement>) => handleSelectSettingKey(e, 'eligibility'),
      subItems: eligibilitySubitemsList,
      title: translate('Heading.Eligibility'),
      content: translate('Description.Eligibility'),
      isParentLink: true,
    });

    if (ixpParams.showAdvancedSettingsPage ?? false) {
      items.push({
        key: 'advanced',
        href: '/settings/advanced',
        label: advancedTitle,
        onClick: (e: React.MouseEvent<HTMLLIElement>) => handleSelectSettingKey(e, 'advanced'),
        title: advancedTitle,
        content: advancedTitle,
      });
    }

    items.push({
      key: 'data-collection',
      href: '/settings/data-collection',
      label: translate('Label.DataSharing'),
      onClick: (e: React.MouseEvent<HTMLLIElement>) => handleSelectSettingKey(e, 'data-collection'),
      title: translate('Label.DataSharing'),
      content: translate('Label.DataSharing'),
    });

    return items;
  }, [
    translate,
    notificationSettings,
    ixpParams.showAdvancedSettingsPage,
    isDevExO18FlagReady,
    showDevExO18LandingPageEnabled,
    handleSelectSettingKey,
  ]);

  return (
    <LeftNavigationMenuV2
      header={translate('Title.Settings')}
      items={menuItems}
      activeKey={activeKey}
      defaultExpanded={defaultExpanded}
    />
  );
};

export default withTranslation(CreatorSettingsLeftNavigation, [
  TranslationNamespace.Notifications,
  TranslationNamespace.Settings,
  TranslationNamespace.SendrNotificationPreferences,
  TranslationNamespace.Preferences,
  TranslationNamespace.Advanced,
  TranslationNamespace.DataCollectionSettings,
  TranslationNamespace.Navigation,
  TranslationNamespace.MarketplaceOnboarding,
  TranslationNamespace.FiatPaidAccess,
  TranslationNamespace.PublicPublish,
  TranslationNamespace.DevEx,
]);
