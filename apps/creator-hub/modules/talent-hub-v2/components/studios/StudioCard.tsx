import React from 'react';
import Link from 'next/link';
import { Thumbnail2d, ThumbnailTypes, ReturnPolicy, UniverseThumbnailSize } from '@rbx/thumbnails';
import type { StudioViewModel } from '../../types';
import { LOGO_SIZE_SMALL } from '../../constants';
import { isMocksEnabled } from '../../utils';
import PlaceholderImage from '../shared/PlaceholderImage';
import styles from '../shared/Layout.module.css';

type StudioCardProps = {
  studio: StudioViewModel;
  href: string;
  onClick?: (studio: StudioViewModel) => void;
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
          imgClassName={styles.thumbnailFillImg}
          alt={studio.name}
        />
      </div>
    );
  }
  return <PlaceholderImage landscape className='width-full' />;
}

export const StudioCard: React.FC<StudioCardProps> = ({ studio, href, onClick }) => {
  return (
    <Link
      href={href}
      className={`${styles.linkReset} ${styles.borderedCard} block width-full bg-surface-100 radius-large clip transition-colors hover:bg-shift-200`}
      onClick={onClick ? () => onClick(studio) : undefined}
      data-testid={`studio-card-${studio.id}`}
      aria-label={studio.name ?? 'Studio'}>
      <div className='flex flex-col'>
        <div className={`relative ${styles.studioBannerWrap}`}>
          <StudioBanner studio={studio} />
          {(studio.openJobsCount ?? 0) > 0 ? (
            <div className={`absolute ${styles.jobsBadgePosition}`}>
              <span className='flex items-center gap-xxsmall bg-surface-100 radius-circle padding-x-small padding-y-xxsmall text-body-small'>
                <span className={styles.statusDot} />
                <span>{studio.openJobsCount} Open Jobs</span>
              </span>
            </div>
          ) : null}
        </div>
        <div className='flex items-start gap-small min-width-0 padding-small small:padding-medium'>
          {studio.logo ? (
            <div className='width-400 height-400 radius-small bg-shift-200 clip'>
              <img
                src={studio.logo}
                alt={studio.name ?? ''}
                className={`width-full height-full ${styles.objectCover}`}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          ) : (
            <PlaceholderImage size={LOGO_SIZE_SMALL} className='radius-small' />
          )}
          <div className='flex flex-col gap-xxsmall min-width-0'>
            <div className='text-heading-small text-truncate-end'>{studio.name}</div>
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
