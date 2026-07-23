import type { TTailwindIconClass } from '@rbx/foundation-tailwind/classes';
import { Icon, Link } from '@rbx/foundation-ui';
import { Typography } from '@rbx/ui';
import { memo } from 'react';

import useGenericNoDataPageStyles from '@components/common/GenericNoDataPage.styles';

interface GenericNoDataPageProps {
  additionalText?: string;
  CustomIconComponent?: React.ComponentType<{ className: string }>;
  iconName?: TTailwindIconClass;
  linkInSubtitle?: NoDataPageLinkProps;
  outlined?: boolean;
  primaryButton?: React.ReactNode;
  secondaryButton?: React.ReactNode;
  subtitle: string;
  title: string;
}

interface NoDataPageLinkProps {
  subtitleLink: string;
  subtitleLinkText: string;
}

const GenericNoDataPage = memo(
  ({
    additionalText,
    CustomIconComponent,
    iconName = 'icon-filled-chart-scatter-plot',
    linkInSubtitle,
    outlined = false,
    primaryButton = null,
    secondaryButton = null,
    subtitle,
    title,
  }: GenericNoDataPageProps) => {
    const {
      classes: {
        avatarStyles,
        buttonsContainer,
        customIconStyles,
        iconStyles,
        innerContainer,
        outerContainer,
        outlinedContainer,
        textContainer,
      },
      cx,
    } = useGenericNoDataPageStyles();

    return (
      <div
        className={cx(outerContainer, { [outlinedContainer]: outlined })}
        data-testid='generic-no-data-page'>
        <div className={innerContainer}>
          {CustomIconComponent ? (
            <CustomIconComponent className={customIconStyles} />
          ) : (
            <div className={avatarStyles} data-testid='generic-no-data-page-icon'>
              <Icon className={iconStyles} name={iconName} size='XLarge' />
            </div>
          )}
          <div className={textContainer}>
            <Typography variant='h4'>{title}</Typography>
            <Typography color='secondary' variant='body2'>
              {subtitle}
              {linkInSubtitle && (
                <>
                  {' '}
                  <Link href={linkInSubtitle.subtitleLink}>{linkInSubtitle.subtitleLinkText}</Link>
                </>
              )}
            </Typography>
            {additionalText && (
              <Typography color='secondary' variant='body2'>
                {additionalText}
              </Typography>
            )}
          </div>
          <div className={buttonsContainer}>
            {primaryButton}
            {secondaryButton}
          </div>
        </div>
      </div>
    );
  },
);

export default GenericNoDataPage;
