import React from 'react';
import { Button } from '@rbx/foundation-ui';
import { Thumbnail2d, ThumbnailTypes, ReturnPolicy } from '@rbx/thumbnails';
import type { TalentProfileViewModel } from '../../types';
import { ProfileCreations } from './ProfileCreations';
import styles from '../shared/Layout.module.css';

type ProfileReadViewProps = {
  profile: TalentProfileViewModel;
  onEdit: () => void;
};

function toRelocationLabel(profile: TalentProfileViewModel): string {
  if (profile.availabilityStatus === undefined) {
    return '\u2014';
  }
  if (profile.availabilityStatus === 1) {
    return 'No';
  }
  if (profile.location.toLowerCase().includes('remote')) {
    return 'Remote only';
  }
  return 'Yes';
}

function toPrimaryRole(profile: TalentProfileViewModel): string {
  const first = profile.jobFunctionLabels[0];
  if (!first) {
    return 'Roblox creator';
  }
  if (first === 'Developer') {
    return 'Software Engineer';
  }
  return first;
}

export const ProfileReadView: React.FC<ProfileReadViewProps> = ({ profile, onEdit }) => {
  return (
    <div className='gap-large flex flex-col'>
      <div className={styles.pageHeader}>
        <div className='items-center gap-medium flex flex-row'>
          {profile.userId ? (
            <div className={styles.profileAvatar}>
              <Thumbnail2d
                targetId={profile.userId}
                type={ThumbnailTypes.avatarHeadshot}
                alt={profile.displayName}
                returnPolicy={ReturnPolicy.PlaceHolder}
                containerClass={styles.thumbnailFill}
                imgClassName={styles.thumbnailFillImg}
              />
            </div>
          ) : null}
          <div className='gap-xxsmall flex flex-col'>
            <div className='text-heading-medium'>
              {profile.displayName || profile.robloxUsername || 'Talent profile'}
            </div>
            {profile.robloxUsername ? (
              <div className='content-muted text-body-large'>@{profile.robloxUsername}</div>
            ) : null}
            <div className='text-body-large'>{toPrimaryRole(profile)}</div>
          </div>
        </div>
        <div className={styles.pageHeaderActions}>
          <Button variant='Standard' size='Medium' onClick={onEdit}>
            Edit profile
          </Button>
        </div>
      </div>

      <div className='gap-large flex flex-col'>
        <div className='gap-small flex flex-col'>
          <h2 className='m-0 text-heading-small'>About</h2>
          <div className='text-body-large'>{profile.bio || '\u2014'}</div>
        </div>

        <div className='flex flex-col'>
          <h2 className='m-0 text-heading-small'>Information</h2>

          <div className={styles.infoRow}>
            <span className='content-muted text-body-medium shrink-0'>Email</span>
            <span className={`text-body-medium ${styles.infoRowValue}`}>
              {profile.contactEmail || '\u2014'}
            </span>
          </div>

          <div className={styles.infoRow}>
            <span className='content-muted text-body-medium shrink-0'>Website</span>
            <span className={`text-body-medium ${styles.infoRowValue}`}>
              {profile.website ? (
                <a className='content-link' href={profile.website} target='_blank' rel='noreferrer'>
                  {profile.website}
                </a>
              ) : (
                '\u2014'
              )}
            </span>
          </div>

          <div className={styles.infoRow}>
            <span className='content-muted text-body-medium shrink-0'>Location</span>
            <span className={`text-body-medium ${styles.infoRowValue}`}>
              {profile.location || '\u2014'}
            </span>
          </div>

          <div className={styles.infoRow}>
            <span className='content-muted text-body-medium shrink-0'>Open to relocation?</span>
            <span className={`text-body-medium ${styles.infoRowValue}`}>
              {toRelocationLabel(profile)}
            </span>
          </div>
        </div>

        <ProfileCreations workExperiences={profile.workExperiences} />
      </div>
    </div>
  );
};

export default ProfileReadView;
