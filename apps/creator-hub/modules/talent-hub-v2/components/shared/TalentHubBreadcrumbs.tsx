import Link from 'next/link';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Breadcrumbs, Link as UILink, Typography } from '@rbx/ui';
import styles from './Layout.module.css';

export type Crumb = {
  label: string;
  labelKey?: string;
  href?: string;
};

type TalentHubBreadcrumbsProps = {
  crumbs: Crumb[];
};

export const TalentHubBreadcrumbs: React.FC<TalentHubBreadcrumbsProps> = ({ crumbs }) => {
  const { translate } = useTranslation();
  const allCrumbs: Crumb[] = [{ label: translate('Heading.Talent'), href: '/hire' }, ...crumbs];
  const getCrumbLabel = (crumb: Crumb) => {
    if (!crumb.labelKey) {
      return crumb.label;
    }
    const translated = translate(crumb.labelKey);
    return translated && translated !== crumb.labelKey ? translated : crumb.label;
  };

  return (
    <nav aria-label='Breadcrumb' className='items-center min-width-0 flex'>
      <span className={`${styles.mobileOnly} font-semibold content-emphasis text-body-medium`}>
        {translate('Heading.Talent')}
      </span>

      <Breadcrumbs aria-label='Breadcrumb' separator='/' className={styles.desktopOnly}>
        {allCrumbs.map((crumb, idx) => {
          const isLast = idx === allCrumbs.length - 1;
          const label = getCrumbLabel(crumb);
          const key = crumb.href ? `${label}-${crumb.href}` : label;

          return isLast || !crumb.href ? (
            <Typography
              key={key}
              color='inherit'
              className={
                isLast
                  ? 'font-semibold content-emphasis text-body-medium'
                  : 'content-muted text-body-medium'
              }
              aria-current={isLast ? 'page' : undefined}>
              {label}
            </Typography>
          ) : (
            <UILink
              key={key}
              component={Link}
              href={crumb.href}
              color='inherit'
              className='content-muted text-body-medium no-underline'>
              {label}
            </UILink>
          );
        })}
      </Breadcrumbs>
    </nav>
  );
};

export default TalentHubBreadcrumbs;
