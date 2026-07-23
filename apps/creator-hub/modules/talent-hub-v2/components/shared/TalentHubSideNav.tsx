import type { FC } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from '@rbx/intl';
import { useAuthentication } from '@modules/authentication/providers';
import useAgeVerification from '../../hooks/useAgeVerification';
import { useIsM2Enabled } from '../../hooks/useIsM2Enabled';
import { useIsInStudioContext, useMyStudios } from '../../hooks/useMyStudios';
import { isLocalTh2DevModeEnabled, isQaOverrideHostAllowed } from '../../utils';
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

type SideNavLabels = {
  discover: string;
  manage: string;
  jobs: string;
  studios: string;
  myJobs: string;
  employerProfile: string;
  applied: string;
  myTalentProfile: string;
  talent: string;
};

function getSections(
  isAuthenticated: boolean,
  isStudioContext: boolean,
  hasOnboardedStudio: boolean,
  m2Enabled: boolean,
  canShowPersonalApplications: boolean,
  labels: SideNavLabels,
): NavSection[] {
  const discover: NavSection = {
    title: labels.discover,
    items: [
      { label: labels.jobs, href: '/hire', matchExact: true },
      { label: labels.studios, href: '/hire/studios' },
    ],
  };

  if (!isAuthenticated) {
    return [discover];
  }

  const manageItems: NavItem[] = [];

  if (isStudioContext) {
    if (m2Enabled && hasOnboardedStudio) {
      manageItems.push({ label: labels.myJobs, href: '/hire/my-studio/jobs' });
    }
    manageItems.push({ label: labels.employerProfile, href: '/hire/my-studio' });
  } else if (m2Enabled) {
    if (canShowPersonalApplications) {
      manageItems.push({ label: labels.applied, href: '/hire/my-profile/applied' });
    }
    manageItems.push({ label: labels.myTalentProfile, href: '/hire/my-profile' });
  }

  if (manageItems.length === 0) {
    return [discover];
  }

  return [discover, { title: labels.manage, items: manageItems }];
}

// Preserve QA override (?th2=1, ?th2m2=1), ?mocks= and ?local= across sidenav
// navigations so testers don't drop out of the experiment between pages.
// Production hosts fail the host-allow check so these never leak to prod URLs.
function useTh2Query(): string {
  const { query } = useRouter();
  const params = new URLSearchParams();
  if (isQaOverrideHostAllowed()) {
    if (query.th2 === '1') {
      params.set('th2', '1');
    }
    if (query.th2m2 === '1') {
      params.set('th2m2', '1');
    }
  }
  if (typeof query.mocks === 'string') {
    params.set('mocks', query.mocks);
  }
  if (typeof query.local === 'string') {
    params.set('local', query.local);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

function matchesItem(pathname: string, item: NavItem): boolean {
  if (item.matchExact) {
    return pathname === item.href || pathname === `${item.href}/`;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/**
 * Pick the best-matching nav item for the current pathname. Multiple items
 * can match via prefix (e.g. `/hire/my-studio/jobs` matches both `My studio`
 * and `My jobs`); we always highlight the longest-matching href so the most
 * specific entry wins. Returns `null` when nothing matches.
 */
function pickActiveHref(pathname: string, sections: NavSection[]): string | null {
  const matches = sections
    .flatMap((section) => section.items)
    .filter((item) => matchesItem(pathname, item));
  if (matches.length === 0) {
    return null;
  }
  return matches.reduce((best, item) => (item.href.length > best.href.length ? item : best)).href;
}

function labelOrFallback(label: string, key: string, fallback: string): string {
  const trimmed = label.trim();
  if (!trimmed || trimmed === key) {
    return fallback;
  }
  return label;
}

export const TalentHubSideNav: FC = () => {
  const { pathname, query } = useRouter();
  const { translate } = useTranslation();
  const { user } = useAuthentication();
  const { isInStudioContext } = useIsInStudioContext();
  const { data: myStudiosData } = useMyStudios();
  const { m2Enabled } = useIsM2Enabled();
  const labels: SideNavLabels = {
    discover: labelOrFallback(translate('Heading.Discover'), 'Heading.Discover', 'Discover'),
    manage: labelOrFallback(translate('Heading.Manage'), 'Heading.Manage', 'Manage'),
    jobs: labelOrFallback(translate('Label.Jobs'), 'Label.Jobs', 'Jobs'),
    studios: labelOrFallback(translate('Label.Studios'), 'Label.Studios', 'Studios'),
    myJobs: labelOrFallback(translate('Heading.MyJobs'), 'Heading.MyJobs', 'My jobs'),
    employerProfile: labelOrFallback(translate('Nav.MyStudio'), 'Nav.MyStudio', 'My studio'),
    applied: labelOrFallback(
      translate('Nav.MyApplications'),
      'Nav.MyApplications',
      'My applications',
    ),
    myTalentProfile: labelOrFallback(
      translate('Nav.MyTalentProfile'),
      'Nav.MyTalentProfile',
      'My talent profile',
    ),
    talent: labelOrFallback(translate('Heading.Talent'), 'Heading.Talent', 'Talent'),
  };
  const localMode = isLocalTh2DevModeEnabled();
  const isAuthenticated = Boolean(user) || localMode;
  const { isVerified } = useAgeVerification(isAuthenticated);
  const isStudioManageRoute =
    pathname.startsWith('/hire/my-studio') ||
    (pathname.startsWith('/hire/jobs/') && query.from === 'profile');
  const showStudioManage = isInStudioContext || isStudioManageRoute;
  const hasOnboardedStudio = Boolean(myStudiosData?.studios?.[0]?.id);
  const sections = getSections(
    isAuthenticated,
    showStudioManage,
    hasOnboardedStudio,
    m2Enabled,
    isVerified,
    labels,
  );
  const activeHref = pickActiveHref(pathname, sections);
  const preservedQuery = useTh2Query();

  return (
    <nav aria-label='Talent Hub navigation'>
      <Link href={`/hire${preservedQuery}`} className={styles.navBrandLink}>
        {labels.talent}
      </Link>
      <div className={styles.sectionDivider} />
      {sections.map((section, sectionIdx) => (
        <div key={section.title}>
          {sectionIdx > 0 && <div className={styles.sectionDivider} />}
          <div className={styles.sectionTitle}>{section.title}</div>
          {section.items.map((item) => {
            const active = item.href === activeHref;
            return (
              <Link
                key={item.href}
                href={`${item.href}${preservedQuery}`}
                className={active ? styles.navLinkActive : styles.navLink}
                aria-current={active ? 'page' : undefined}>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
};

export default TalentHubSideNav;
