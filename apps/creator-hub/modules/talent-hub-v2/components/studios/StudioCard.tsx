import Link from 'next/link';
import React from 'react';
import { Thumbnail2d, ThumbnailTypes, ReturnPolicy, UniverseThumbnailSize } from '@rbx/thumbnails';
import { LOGO_SIZE_SMALL } from '../../constants';
import type { StudioViewModel } from '../../types';
import { isMocksEnabled, toRobloxCommunityAboutHref } from '../../utils';
import OpenJobsBadgeIcon from '../shared/OpenJobsBadgeIcon';
import PlaceholderImage from '../shared/PlaceholderImage';
import StudioLogo from '../shared/StudioLogo';
import styles from '../shared/Layout.module.css';

type StudioCardProps = {
  studio: StudioViewModel;
  href: string;
  onClick?: (studio: StudioViewModel) => void;
  preferCommunityLink?: boolean;
};

function StudioBanner({ studio }: { studio: StudioViewModel }) {
  const mocks = isMocksEnabled();
  const firstUniverse = studio.topExperienceUniverseIds?.[0];
  if (firstUniverse && !mocks) {
    return (
      <div className={`width-full clip ${styles.bannerTopRadius} ${styles.aspectRatio16x9}`}>
        <Thumbnail2d
          targetId={firstUniverse}
          type={ThumbnailTypes.universeThumbnail}
          // eslint-disable-next-line no-underscore-dangle -- enum value from @rbx/thumbnails
          size={UniverseThumbnailSize._576x324}
          returnPolicy={ReturnPolicy.PlaceHolder}
          containerClass={styles.thumbnailFill}
          imgClassName={`${styles.thumbnailFillImg} ${styles.studioBannerThumbnailImg}`}
          alt={studio.name}
        />
      </div>
    );
  }
  return <PlaceholderImage landscape landscapeBanner className='width-full' />;
}

export const StudioCard: React.FC<StudioCardProps> = ({
  studio,
  href,
  onClick,
  preferCommunityLink = false,
}) => {
  const studioHref = preferCommunityLink
    ? (toRobloxCommunityAboutHref(studio.group, studio.groupId) ?? href)
    : href;
  const isExternalStudioHref = studioHref.startsWith('http');

  return (
    <Link
      href={studioHref}
      target={isExternalStudioHref ? '_blank' : undefined}
      rel={isExternalStudioHref ? 'noreferrer' : undefined}
      className={`${styles.linkReset} ${styles.borderedCard} block width-full bg-surface-100 radius-large clip transition-colors hover:bg-shift-200`}
      onClick={onClick ? () => onClick(studio) : undefined}
      data-testid={`studio-card-${studio.id}`}
      aria-label={studio.name ?? 'Studio'}>
      <div className='flex flex-col'>
        <div className={`relative ${styles.studioBannerWrap}`}>
          <StudioBanner studio={studio} />
          {(studio.openJobsCount ?? 0) > 0 ? (
            <div className={`absolute ${styles.jobsBadgePosition}`}>
              <span className={styles.jobsBadge}>
                <OpenJobsBadgeIcon className={styles.jobsBadgeIcon} />
                <span className={styles.jobsBadgeLabel}>{studio.openJobsCount} Open Jobs</span>
              </span>
            </div>
          ) : null}
        </div>
        <div className='flex items-start gap-small min-width-0 padding-small small:padding-medium'>
          <StudioLogo
            logo={studio.logo}
            groupId={studio.groupId}
            size={LOGO_SIZE_SMALL}
            alt={studio.name ?? ''}
            className='radius-small'
          />
          <div className='flex flex-col gap-xxsmall min-width-0'>
            <div className='text-body-large text-truncate-end'>{studio.name}</div>
            <div className='text-body-small content-muted text-truncate-end'>
              {`Remote | ${studio.teamSizeLabel} employees`}
            </div>
          </div>
        </div>
        <div className='padding-x-small small:padding-x-medium padding-bottom-small small:padding-bottom-medium'>
          <div className={styles.lineClampTwo}>
            <span className='text-body-medium content-muted'>{studio.description}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default StudioCard;
