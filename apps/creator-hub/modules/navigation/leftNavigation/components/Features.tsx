import React, { useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from '@rbx/intl';
import CreatorDashboardContext from '@modules/eventStream/enum/CreatorDashboardContext';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import CreatorDashboardSource from '@modules/eventStream/enum/CreatorDashboardSource';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import {
  viewComputeTab,
  viewNotificationsEventMode,
  type TrackerClientRequest,
} from '@modules/eventStream/constants/eventConstants';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { useAuthentication } from '@modules/authentication/providers';
import LeftNavigationMenu from './LeftNavigationMenu';
import { MenuItem } from '../interface/menuItem';
import Feature from '../../feature/interfaces/Feature';
import LeftNavigationList from '../componentsV2/LeftNavigationList';

export interface FeaturesProps<T> {
  title?: string;
  features: Feature<T>[];
  activeFeature?: Feature<T>;
  variant?: 'menu' | 'list' | 'iconOnlyList';
  defaultExpanded?: string[];
  onExpandedItemsChange?: (event: React.SyntheticEvent | null, itemIds: string[]) => void;
  name?: string;
}

function Features<T>({
  title,
  features,
  activeFeature,
  variant = 'menu',
  defaultExpanded,
  onExpandedItemsChange,
  name = 'features',
}: FeaturesProps<T>) {
  const { trackerClient } = useEventTrackerProvider();
  const router = useRouter();
  const { translate } = useTranslation();
  const { user } = useAuthentication();
  const getTrackerClientRequest = (event: CreatorDashboardEventType): TrackerClientRequest => {
    return {
      eventType: event,
      context: CreatorDashboardContext.Click,
      additionalProperties: {
        Source: CreatorDashboardSource.LeftNavigation,
      },
    };
  };

  const featureToMenuItem = useCallback(
    (feature: Feature<T>): MenuItem<Feature<T>> => {
      return {
        icon: feature.icon,
        activeIcon: feature.activeIcon,
        key: feature.key,
        title: translate(feature.nameKey), // TODO @mryumae: ensure translation is correct once public
        adornment: feature.adornment,
        subItems: feature.subFeatures?.map(featureToMenuItem),
        content: feature,
      };
    },
    [translate],
  );
  const menuItems: MenuItem<Feature<T>>[] = useMemo(
    () => features.map(featureToMenuItem),
    [features, featureToMenuItem],
  );
  const handleSelectFeature = useCallback(
    async (item: MenuItem) => {
      const selectedFeature = item.content as Feature;
      const { activeTab, ...otherProps } = router.query; // remove activeTab from query to avoid param being displayed in unrelated pages
      const query = otherProps;
      unifiedLoggerClient.logClickEvent({
        eventName: `clickLeftNav.${name}.${selectedFeature.key}`,
      });
      if (selectedFeature.getExternalPath) {
        window.open(selectedFeature.getExternalPath(), '_blank');
      } else if (selectedFeature.onSelectFeature) {
        selectedFeature.onSelectFeature();
      } else if (selectedFeature.path) {
        const pathQuery = selectedFeature.getQuery?.() ?? selectedFeature.query ?? {};
        await router.push({
          pathname: selectedFeature.path,
          query: { ...otherProps, ...pathQuery },
        });
      }
      if (selectedFeature.key === 'compute') {
        trackerClient.sendEvent(viewComputeTab);
      }
      if (selectedFeature.key === 'localization') {
        trackerClient.sendEvent(
          getTrackerClientRequest(CreatorDashboardEventType.ViewLocalization),
        );
      }
      if (selectedFeature.key === 'translatorPortal') {
        trackerClient.sendEvent(
          getTrackerClientRequest(CreatorDashboardEventType.ViewTranslatorPortal),
        );
      }
      if (selectedFeature.key === 'notifications' && query.id) {
        const universeId = typeof query.id === 'string' ? query.id : query.id[0];
        trackerClient.sendEvent(viewNotificationsEventMode(user?.id, universeId));
      }
    },
    [router, user, trackerClient, name],
  );

  if (variant === 'list' || variant === 'iconOnlyList') {
    return (
      <LeftNavigationList
        header={variant === 'list' ? title : undefined}
        onSelectItem={handleSelectFeature}
        items={menuItems}
        activeKey={activeFeature?.key}
        iconOnly={variant === 'iconOnlyList'}
      />
    );
  }

  return (
    <LeftNavigationMenu
      header={title}
      onSelectItem={handleSelectFeature}
      items={menuItems}
      activeKey={activeFeature?.key}
      defaultExpanded={defaultExpanded}
      onExpandedItemsChange={onExpandedItemsChange}
    />
  );
}

export default Features;
