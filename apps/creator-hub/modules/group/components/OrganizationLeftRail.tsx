import { useRouter } from 'next/router';
import React, { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { Thumbnail2d, ThumbnailTypes, GroupIconSize } from '@rbx/thumbnails';
import { makeStyles } from '@rbx/ui';
import LeftNavigationMenuV2 from '@modules/navigation/leftNavigation/components/LeftNavigationMenuV2';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';

const useStyles = makeStyles()(() => ({
  avatar: {
    display: 'block',
  },
}));
const OrganizationLeftRail: React.FC = () => {
  const { translate } = useTranslation();
  const group = useCurrentGroup();
  const { settings } = useSettings();
  const {
    classes: { avatar },
  } = useStyles();
  const { pathname } = useRouter();

  const items = useMemo(() => {
    const menuItems = [];
    const groupBaseUrl = '/dashboard/group';
    menuItems.push({
      key: 'profile',
      href: `${groupBaseUrl}/profile`,
      label: translate('Label.GroupProfile'),
    });
    menuItems.push({
      key: 'members',
      href: `${groupBaseUrl}/members`,
      label: translate('Heading.Members'),
    });
    menuItems.push({
      key: 'roles',
      href: `${groupBaseUrl}/roles`,
      label: translate('Heading.Roles'),
    });
    if (settings.enableGroupModerationPage) {
      menuItems.push({
        key: 'moderation',
        href: `${groupBaseUrl}/moderation`,
        label: translate('Heading.Moderation'),
      });
    }
    menuItems.push({
      key: 'activity-history',
      href: `${groupBaseUrl}/activity-history`,
      label: translate('Label.ActivityHistory'),
    });

    return menuItems;
  }, [translate, settings.enableGroupModerationPage]);

  const activeKey = useMemo(() => {
    if (pathname.includes('roles')) {
      return 'roles';
    }
    return pathname.split('/').pop();
  }, [pathname]);

  return (
    <LeftNavigationMenuV2
      activeKey={activeKey}
      icon={
        <Thumbnail2d
          containerClass={avatar}
          type={ThumbnailTypes.groupIcon}
          // eslint-disable-next-line no-underscore-dangle -- imported for package
          size={GroupIconSize._150x150}
          targetId={group?.id || 0}
          alt={group?.name || ''}
        />
      }
      header={group?.name}
      items={items}
    />
  );
};

export default OrganizationLeftRail;
