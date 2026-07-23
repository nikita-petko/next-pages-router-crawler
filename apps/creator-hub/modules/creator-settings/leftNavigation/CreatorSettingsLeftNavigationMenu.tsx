import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useContext,
} from 'react';
import LeftNavigationMenuV2 from '@modules/navigation/leftNavigation/components/LeftNavigationMenuV2';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { CreatorNotificationCategory } from '@rbx/clients/creatorSettings';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import { notificationSettingsLeftNavEventModel } from '@modules/eventStream/constants/eventConstants';
import { useAuthentication } from '@modules/authentication/providers';
import Router, { useRouter } from 'next/router';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import { useSettings } from '@modules/settings';
import { FrontendFlagName } from '@modules/toolboxService/toolboxFeatureManagement';
import { useToolboxServiceApiProvider } from '@modules/toolboxService/ToolboxServiceApiProvider';
import {
  CreatorNotificationsSettingsContext,
  TCreatorNotificationsSettingsContext,
} from '../hooks/CreatorNotificationsSettingsContext';
import { getEligibilityNavigationSubitems } from '../hooks/getEligibilityNavigationSubitems';

const CreatorSettingsLeftNavigation: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const { translate } = useTranslation();
  const [activeKey, setActiveKey] = useState('');
  const { trackerClient } = useEventTrackerProvider();
  const [defaultExpanded, setDefaultExpanded] = useState<string[]>([]);
  const router = useRouter();
  const { user } = useAuthentication();
  const { notificationSettings } = useContext<TCreatorNotificationsSettingsContext>(
    CreatorNotificationsSettingsContext,
  );
  const { params: ixpParams } = useIXPParameters(IXPLayers.CreatorDashboard);
  const { frontendFlags } = useToolboxServiceApiProvider();
  const enableAudioDistributionOnboarding =
    frontendFlags[FrontendFlagName.FrontendFlagEnableAudioDistributionOnboarding];

  const { settings } = useSettings();

  const handleSelectSettingKey = useCallback(
    (e: React.MouseEvent<HTMLLIElement, MouseEvent>, key: string) => {
      e.preventDefault();
      e.stopPropagation();
      trackerClient.sendEvent(notificationSettingsLeftNavEventModel(activeKey, key));
      Router.push(`/settings/${key}`);
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
          onClick: (e: React.MouseEvent<HTMLLIElement, MouseEvent>) =>
            handleSelectSettingKey(e, key),
          title: categorySafeKey,
          content: categorySafeKey,
        };
      },
    );

    const isPublishingPermissionsEnabled = settings.enableCoreContentStatusLabelLink ?? false;
    const eligibilityNavigationSubitems = getEligibilityNavigationSubitems(
      enableAudioDistributionOnboarding,
      true, // showExtendedServices
      !isPublishingPermissionsEnabled, // showPublicPublish
      isPublishingPermissionsEnabled, // showPublishingPermissions
    );
    const eligibilitySubitemsList = eligibilityNavigationSubitems.flatMap((setting) => {
      const key = `eligibility/${setting.key}`;
      return {
        key,
        label: translate(setting.title),
        href: `/settings/${key}`,
        onClick: (e: React.MouseEvent<HTMLLIElement, MouseEvent>) => handleSelectSettingKey(e, key),
        title: translate(setting.title),
        content: translate(setting.content),
      };
    });

    const items = [
      {
        key: 'preferences',
        href: '/settings/preferences',
        label: preferencesTitle,
        onClick: (e: React.MouseEvent<HTMLLIElement, MouseEvent>) =>
          handleSelectSettingKey(e, 'preferences'),
        title: preferencesTitle,
        content: preferencesTitle,
      },
      {
        key: 'notifications',
        href: '/settings/notifications',
        label: notificationsTitle,
        onClick: (e: React.MouseEvent<HTMLLIElement, MouseEvent>) =>
          handleSelectSettingKey(e, 'notifications'),
        subItems: notificationsSubitemsList,
        title: notificationsTitle,
        content: notificationsTitle,
        isParentLink: true,
      },
      {
        key: 'webhooks',
        href: '/settings/webhooks',
        label: webhooksTitle,
        onClick: (e: React.MouseEvent<HTMLLIElement, MouseEvent>) =>
          handleSelectSettingKey(e, 'webhooks'),

        title: webhooksTitle,
        content: webhooksTitle,
      },
    ];

    items.push({
      key: 'eligibility',
      href: '/settings/eligibility',
      label: translate('Heading.Eligibility'),
      onClick: (e: React.MouseEvent<HTMLLIElement, MouseEvent>) =>
        handleSelectSettingKey(e, 'eligibility'),
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
        onClick: (e: React.MouseEvent<HTMLLIElement, MouseEvent>) =>
          handleSelectSettingKey(e, 'advanced'),
        title: advancedTitle,
        content: advancedTitle,
      });
    }

    items.push({
      key: 'data-collection',
      href: '/settings/data-collection',
      label: translate('Label.DataSharing'),
      onClick: (e: React.MouseEvent<HTMLLIElement, MouseEvent>) =>
        handleSelectSettingKey(e, 'data-collection'),
      title: translate('Label.DataSharing'),
      content: translate('Label.DataSharing'),
    });

    return items;
  }, [
    translate,
    notificationSettings,
    enableAudioDistributionOnboarding,
    settings.enableCoreContentStatusLabelLink,
    ixpParams.showAdvancedSettingsPage,
    handleSelectSettingKey,
  ]);

  useEffect(() => {
    const splitPath = router.pathname?.split('/');
    let key = splitPath[splitPath.length - 1];
    if (key === '[notificationCategory]') {
      key = `notifications/${router.query.notificationCategory}`;
      setDefaultExpanded(['parent-notifications']);
    }
    if (key === 'notifications') {
      key = 'parent-notifications';
    }
    setActiveKey(key);
  }, [router.query, router.pathname, user?.id]);

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
]);
