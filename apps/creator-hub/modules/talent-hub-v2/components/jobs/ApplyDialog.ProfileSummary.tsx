import React, { useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import { Thumbnail2d, ThumbnailTypes, ReturnPolicy } from '@rbx/thumbnails';
import { toTalentProfileViewModel } from '../../hooks/useTalentProfileViewModel';
import type { ApiTalentProfile } from '../../types';
import { ProfileCreations } from '../profile/ProfileCreations';
import dialogStyles from '../shared/Layout.module.css';

const ProfileAvatar: React.FC<{ userId: number; displayName: string }> = ({
  userId,
  displayName,
}) => (
  <div className={dialogStyles.applyDialogAvatar}>
    <Thumbnail2d
      targetId={userId}
      type={ThumbnailTypes.avatarHeadshot}
      alt={displayName}
      returnPolicy={ReturnPolicy.PlaceHolder}
      containerClass={dialogStyles.thumbnailFill}
      imgClassName={dialogStyles.thumbnailFillImg}
    />
  </div>
);

export const ProfileSummaryContents: React.FC<{
  profile: ApiTalentProfile;
  robloxUsername: string;
}> = ({ profile, robloxUsername }) => {
  const { translate } = useTranslation();
  const tr = useCallback(
    (key: string, fallback: string) => {
      const value = translate(key);
      return value && value !== key ? value : fallback;
    },
    [translate],
  );
  const vm = toTalentProfileViewModel(profile, robloxUsername);
  return (
    <div className='gap-medium flex flex-col'>
      <div className='items-center gap-small flex'>
        {profile.userId !== undefined ? (
          <ProfileAvatar userId={profile.userId} displayName={vm.displayName || robloxUsername} />
        ) : null}
        <div className='flex flex-col'>
          <span className='text-title-small'>{vm.displayName || '—'}</span>
          {vm.robloxUsername ? (
            <span className='content-muted text-body-small'>@{vm.robloxUsername}</span>
          ) : null}
        </div>
      </div>

      {vm.bio ? (
        <div className='gap-xxsmall flex flex-col'>
          <span className='text-title-large'>{tr('Heading.About', 'About')}</span>
          <span className='text-body-medium'>{vm.bio}</span>
        </div>
      ) : null}

      <div className='flex flex-col'>
        {vm.contactEmail ? (
          <div className={dialogStyles.infoRow}>
            <span className='content-muted text-body-medium'>
              {tr('Label.ContactEmail', 'Email')}
            </span>
            <span className='text-body-medium'>{vm.contactEmail}</span>
          </div>
        ) : null}
        {vm.website ? (
          <div className={dialogStyles.infoRow}>
            <span className='content-muted text-body-medium'>{tr('Label.Website', 'Website')}</span>
            <span className='text-body-medium'>{vm.website}</span>
          </div>
        ) : null}
        {vm.location ? (
          <div className={dialogStyles.infoRow}>
            <span className='content-muted text-body-medium'>
              {tr('Label.Location', 'Location')}
            </span>
            <span className='text-body-medium'>{vm.location}</span>
          </div>
        ) : null}
        {vm.availabilityLabel ? (
          <div className={dialogStyles.infoRow}>
            <span className='content-muted text-body-medium'>
              {tr('Label.Availability', 'Availability')}
            </span>
            <span className='text-body-medium'>
              {vm.availabilityLabel}
              {vm.preferredJobTypeLabel ? ` · ${vm.preferredJobTypeLabel}` : ''}
            </span>
          </div>
        ) : null}
        {vm.jobFunctionLabels.length > 0 ? (
          <div className={dialogStyles.infoRow}>
            <span className='content-muted text-body-medium'>
              {tr('Label.JobFunctions', 'Job functions')}
            </span>
            <span className='text-body-medium'>{vm.jobFunctionLabels.join(', ')}</span>
          </div>
        ) : null}
      </div>
      <ProfileCreations workExperiences={vm.workExperiences} size='large' />
    </div>
  );
};

export const ReviewProfileSection: React.FC<{
  profile: ApiTalentProfile;
  robloxUsername: string;
}> = ({ profile, robloxUsername }) => {
  const { translate } = useTranslation();
  return (
    <div className='gap-medium flex flex-col'>
      <div className='text-title-large'>
        {translate('Heading.ProfileInformation') || 'Profile information'}
      </div>
      <ProfileSummaryContents profile={profile} robloxUsername={robloxUsername} />
    </div>
  );
};
