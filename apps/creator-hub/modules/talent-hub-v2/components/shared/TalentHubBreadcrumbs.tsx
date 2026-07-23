import React from 'react';
import Link from 'next/link';
import styles from './Layout.module.css';

export type Crumb = {
  label: string;
  href?: string;
};

type TalentHubBreadcrumbsProps = {
  crumbs: Crumb[];
};

export const TalentHubBreadcrumbs: React.FC<TalentHubBreadcrumbsProps> = ({ crumbs }) => {
  const allCrumbs: Crumb[] = [{ label: 'Talent', href: '/hire' }, ...crumbs];

  return (
    <nav aria-label='Breadcrumb' className='flex items-center min-width-0'>
      <span className={`${styles.mobileOnly} text-body-medium content-emphasis font-semibold`}>
        Talent
      </span>

      <span className={styles.desktopOnly}>
        {allCrumbs.map((crumb, idx) => {
          const isLast = idx === allCrumbs.length - 1;
          return (
            <React.Fragment key={crumb.label}>
              {idx > 0 && (
                <span
                  className='text-body-medium content-muted margin-x-small select-none'
                  aria-hidden='true'>
                  /
                </span>
              )}
              {isLast || !crumb.href ? (
                <span
                  className={
                    isLast
                      ? 'text-body-medium content-emphasis font-semibold'
                      : 'text-body-medium content-muted'
                  }
                  aria-current={isLast ? 'page' : undefined}>
                  {crumb.label}
                </span>
              ) : (
                <Link href={crumb.href} className='text-body-medium content-muted no-underline'>
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </span>
    </nav>
  );
};

export default TalentHubBreadcrumbs;
