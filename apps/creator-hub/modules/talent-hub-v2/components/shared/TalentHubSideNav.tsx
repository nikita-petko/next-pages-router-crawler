import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthentication } from '@modules/authentication/providers';
import { FeatureFlagName, useSettings } from '@modules/settings';
import { useMyStudios } from '../../hooks/useMyStudios';
import styles from './Layout.module.css';

type NavItem = {
  label: string;
  href: string;
  matchExact?: boolean;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

function getSections(
  isAuthenticated: boolean,
  hasStudios: boolean,
  m2Enabled: boolean,
): NavSection[] {
  const discover: NavSection = {
    title: 'Discover',
    items: [
      { label: 'Jobs', href: '/hire', matchExact: true },
      { label: 'Studios', href: '/hire/studios' },
    ],
  };

  if (!isAuthenticated) {
    return [discover];
  }

  const manageItems: NavItem[] = [];

  if (hasStudios || m2Enabled) {
    manageItems.push({ label: 'Profile', href: '/hire/profile' });
  }

  if (hasStudios && m2Enabled) {
    manageItems.push({ label: 'Inbox', href: '/hire/inbox' });
  }

  if (manageItems.length === 0) {
    return [discover];
  }

  const manage: NavSection = {
    title: 'Manage',
    items: manageItems,
  };

  return [discover, manage];
}

function isActive(pathname: string, item: NavItem): boolean {
  if (item.matchExact) {
    return pathname === item.href || pathname === `${item.href}/`;
  }
  return pathname.startsWith(item.href);
}

export const TalentHubSideNav: React.FC = () => {
  const { pathname } = useRouter();
  const { user } = useAuthentication();
  const { settings } = useSettings();
  const { data: myStudiosData } = useMyStudios();
  const isAuthenticated = Boolean(user);
  const hasStudios = isAuthenticated && (myStudiosData?.studios?.length ?? 0) > 0;
  const m2Enabled = Boolean(settings?.[FeatureFlagName.enableTalentHubV2M2]);
  const sections = getSections(isAuthenticated, hasStudios, m2Enabled);

  return (
    <nav aria-label='Talent Hub navigation'>
      <Link href='/hire' className={styles.navBrandLink}>
        Talent
      </Link>
      <div className={styles.sectionDivider} />
      {sections.map((section, sectionIdx) => (
        <div key={section.title}>
          {sectionIdx > 0 && <div className={styles.sectionDivider} />}
          <div className={styles.sectionTitle}>{section.title}</div>
          {section.items.map((item) => {
            const active = isActive(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? styles.navLinkActive : styles.navLink}
                aria-current={active ? 'page' : undefined}>
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
};

export default TalentHubSideNav;
