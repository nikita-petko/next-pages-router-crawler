import React, { useMemo } from 'react';
import { Icon, Tooltip, TooltipTrigger, clsx } from '@rbx/foundation-ui';
import { Thumbnail2d, ThumbnailTypes, ReturnPolicy, UniverseThumbnailSize } from '@rbx/thumbnails';
import { useExperienceDetails } from '../../hooks/useExperienceDetails';
import type { WorkExperience } from '../../types';
import { isMocksEnabled } from '../../utils';
import PlaceholderImage from '../shared/PlaceholderImage';
import styles from '../shared/Layout.module.css';

type ProfileCreationsProps = {
  workExperiences?: WorkExperience[] | null;
  title?: string;
  emptyContent?: React.ReactNode;
  size?: 'default' | 'large';
};

function normalizeWorkExperiences(workExperiences?: WorkExperience[] | null) {
  return (workExperiences ?? [])
    .map((item) => {
      const universeId = Number(item.universeId);
      if (!Number.isFinite(universeId) || universeId <= 0) {
        return null;
      }
      return {
        universeId,
        fallbackTitle:
          (item.title ?? `Experience ${universeId}`).trim() || `Experience ${universeId}`,
      };
    })
    .filter((item): item is { universeId: number; fallbackTitle: string } => Boolean(item));
}

export const ProfileCreations: React.FC<ProfileCreationsProps> = ({
  workExperiences,
  title = "Creations I've worked on",
  emptyContent = null,
  size = 'default',
}) => {
  const normalizedExperiences = useMemo(
    () => normalizeWorkExperiences(workExperiences),
    [workExperiences],
  );
  const universeIds = useMemo(
    () => normalizedExperiences.map((item) => item.universeId),
    [normalizedExperiences],
  );
  const { details: experienceDetails, isLoading } = useExperienceDetails(universeIds);
  const experienceByUniverseId = useMemo(
    () => new Map(experienceDetails.map((item) => [item.universeId, item])),
    [experienceDetails],
  );

  if (normalizedExperiences.length === 0) {
    return emptyContent ? <>{emptyContent}</> : null;
  }

  return (
    <div className='gap-small flex flex-col'>
      <div className='items-center gap-xxsmall flex'>
        <h2 className='m-0 text-heading-small'>{title}</h2>
        <Tooltip
          position='top-center'
          title='Creations are self-reported. We recommend verifying work experience with applicants.'>
          <TooltipTrigger asChild>
            <span className='items-center content-muted inline-flex'>
              <Icon name='icon-regular-circle-i' size='Small' />
            </span>
          </TooltipTrigger>
        </Tooltip>
      </div>

      {isLoading ? (
        <div
          className={clsx(
            styles.profileCreationCards,
            size === 'large' && styles.profileCreationCardsLarge,
          )}>
          {[0, 1, 2].map((i) => (
            <div key={i} className={styles.profileCreationCard}>
              <div className={`bg-shift-200 width-full radius-large ${styles.aspectRatio16x9}`} />
            </div>
          ))}
        </div>
      ) : (
        <div
          className={clsx(
            styles.profileCreationCards,
            size === 'large' && styles.profileCreationCardsLarge,
          )}>
          {normalizedExperiences.map((item) => {
            const detail = experienceByUniverseId.get(item.universeId);
            const name = detail?.name ?? item.fallbackTitle;
            const href = detail?.url ?? `https://www.roblox.com/games/${item.universeId}`;
            return (
              <a
                key={item.universeId}
                href={href}
                target='_blank'
                rel='noreferrer'
                className={clsx('flex flex-col', styles.linkReset, styles.profileCreationCard)}>
                {!isMocksEnabled() ? (
                  <div className={`width-full radius-large clip ${styles.aspectRatio16x9}`}>
                    <Thumbnail2d
                      targetId={item.universeId}
                      type={ThumbnailTypes.universeThumbnail}
                      // eslint-disable-next-line no-underscore-dangle -- enum value from @rbx/thumbnails
                      size={UniverseThumbnailSize._576x324}
                      returnPolicy={ReturnPolicy.PlaceHolder}
                      containerClass={styles.thumbnailFill}
                      imgClassName={styles.thumbnailFillImg}
                      alt={name}
                    />
                  </div>
                ) : (
                  <div className={`width-full radius-large ${styles.aspectRatio16x9}`}>
                    <PlaceholderImage landscape />
                  </div>
                )}
                <div className={`width-full flex flex-col ${styles.profileCreationCaption}`}>
                  <div className='text-title-small'>{name}</div>
                  <div className='content-muted text-body-small'>Self-selected</div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProfileCreations;
