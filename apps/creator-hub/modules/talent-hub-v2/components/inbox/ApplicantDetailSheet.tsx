import React, { useCallback, useState } from 'react';
import { Badge, Button, Divider, Icon, clsx } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Thumbnail2d, ThumbnailTypes, ReturnPolicy } from '@rbx/thumbnails';
import { resumeClient } from '../../api/resumeClient';
import { downloadMockResume, downloadResumeUrl } from '../../api/resumeDownload';
import type { ApplicantRowViewModel, StudioApplicantViewModel } from '../../types';
import { isMocksEnabled } from '../../utils';
import { ProfileCreations } from '../profile/ProfileCreations';
import { TalentSignal } from '../signal/TalentSignal';
import styles from '../shared/Layout.module.css';

type ApplicantDetailSheetProps = {
  applicant: StudioApplicantViewModel;
  applicantRow?: ApplicantRowViewModel;
  onClose: () => void;
  onInterested: () => void;
  onNotInterested: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
};

function toRelocationLabel(profile: { availabilityStatus: unknown; location: string }): string {
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

export const ApplicantDetailSheet: React.FC<ApplicantDetailSheetProps> = ({
  applicant,
  applicantRow,
  onClose,
  onInterested,
  onNotInterested,
  onPrevious,
  onNext,
}) => {
  const { translate } = useTranslation();
  const tp = applicant.talentProfile;
  const displayName = applicantRow?.talentName || tp.displayName || 'Applicant';
  const username = applicantRow?.talentUsername || tp.robloxUsername || '';
  const submittedAt = applicantRow?.submittedAt ?? applicant.submittedAt;
  const userId = applicantRow?.talentUserId ?? tp.userId;
  const [isDownloadingResume, setIsDownloadingResume] = useState(false);
  const [resumeDownloadError, setResumeDownloadError] = useState<string | null>(null);
  const tr = useCallback(
    (key: string, fallback: string) => {
      const text = translate(key);
      if (!text?.trim()) {
        return fallback;
      }
      if (text === key) {
        return fallback;
      }
      if (text.startsWith('<') && text.endsWith('>')) {
        return fallback;
      }
      return text;
    },
    [translate],
  );

  const handleDownloadResume = useCallback(async () => {
    if (!applicant.resumeId) {
      return;
    }
    setIsDownloadingResume(true);
    setResumeDownloadError(null);
    try {
      if (isMocksEnabled()) {
        downloadMockResume();
        return;
      }
      const { downloadUrl } = await resumeClient.getDownloadUrl(applicant.resumeId, {
        applicationId: applicant.id,
      });
      if (!downloadUrl) {
        throw new Error('Missing resume download URL');
      }
      await downloadResumeUrl(downloadUrl);
    } catch {
      setResumeDownloadError(
        tr('Error.FailedToDownloadResume', 'Unable to download resume. Please try again.'),
      );
    } finally {
      setIsDownloadingResume(false);
    }
  }, [applicant.id, applicant.resumeId, tr]);

  return (
    <div className='height-full flex flex-col' data-testid='applicant-detail-sheet'>
      <div className={styles.sheetHandle}>
        <div className={styles.sheetHandleBar} />
      </div>

      <div className={clsx(styles.detailPanelBody, styles.applicantDetailBody)}>
        <div
          className={clsx(
            'items-center justify-end gap-xsmall flex',
            styles.applicantSheetControls,
          )}>
          <div className='items-center gap-xsmall flex'>
            <Button variant='Utility' size='Small' onClick={onPrevious} isDisabled={!onPrevious}>
              <Icon name='icon-regular-chevron-small-up' size='Small' />
            </Button>
            <Button variant='Utility' size='Small' onClick={onNext} isDisabled={!onNext}>
              <Icon name='icon-regular-chevron-small-down' size='Small' />
            </Button>
          </div>
          <Button variant='Utility' size='Small' onClick={onClose}>
            <Icon name='icon-regular-x' size='Small' />
          </Button>
        </div>

        <div className='items-start gap-small flex'>
          {userId !== undefined ? (
            <div className={styles.applicantSheetAvatar}>
              <Thumbnail2d
                targetId={userId}
                type={ThumbnailTypes.avatarHeadshot}
                alt={displayName}
                returnPolicy={ReturnPolicy.PlaceHolder}
                containerClass={styles.thumbnailFill}
                imgClassName={styles.thumbnailFillImg}
              />
            </div>
          ) : (
            <div className={styles.applicantSheetAvatar} aria-hidden />
          )}
          <div className='gap-xxsmall flex flex-col'>
            <div className='text-heading-small'>{displayName}</div>
            {username ? <span className='content-muted text-body-medium'>@{username}</span> : null}
            {submittedAt ? (
              <div className='content-muted text-body-small'>
                Applied{' '}
                {submittedAt.toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
            ) : null}
          </div>
        </div>

        <Divider />

        {tp.bio ? (
          <div className={styles.applicantDetailSection}>
            <div className='text-heading-small'>About</div>
            <div className='content-default text-body-medium'>{tp.bio}</div>
          </div>
        ) : null}

        <div className={styles.applicantDetailSection}>
          <div className='text-heading-small'>{tr('Label.Resume', 'Resume')}</div>
          {applicant.resumeId ? (
            <div className='items-start gap-xxsmall flex flex-col'>
              <Button
                variant='Standard'
                size='Medium'
                onClick={handleDownloadResume}
                isDisabled={isDownloadingResume}>
                <span className='items-center gap-xsmall flex'>
                  <Icon name='icon-regular-arrow-down-to-line' size='Small' />
                  <span>{tr('Action.Download', 'Download')}</span>
                </span>
              </Button>
              {resumeDownloadError ? (
                <span className='content-alert text-body-small'>{resumeDownloadError}</span>
              ) : null}
            </div>
          ) : (
            <span className='content-muted text-body-medium'>
              {tr('Text.NoResumeAttached', 'No resume attached.')}
            </span>
          )}
        </div>

        <div className={styles.applicantDetailSection}>
          <div className='text-heading-small'>Information</div>

          <div className={styles.infoRow}>
            <span className='content-muted text-title-small shrink-0'>Email</span>
            <span className={`text-body-medium ${styles.infoRowValue}`}>
              {tp.contactEmail ? (
                <a
                  className={clsx('content-default', styles.linkReset)}
                  href={`mailto:${tp.contactEmail}`}>
                  {tp.contactEmail}
                </a>
              ) : (
                '\u2014'
              )}
            </span>
          </div>

          <div className={styles.infoRow}>
            <span className='content-muted text-title-small shrink-0'>Website</span>
            <span className={`text-body-medium ${styles.infoRowValue}`}>
              {tp.website ? (
                <a
                  className={clsx('content-default', styles.linkReset)}
                  href={tp.website}
                  target='_blank'
                  rel='noreferrer'>
                  {tp.website}
                </a>
              ) : (
                '\u2014'
              )}
            </span>
          </div>

          <div className={styles.infoRow}>
            <span className='content-muted text-title-small shrink-0'>Location</span>
            <span className={`text-body-medium ${styles.infoRowValue}`}>
              {tp.location || '\u2014'}
            </span>
          </div>

          <div className={styles.infoRow}>
            <span className='content-muted text-title-small shrink-0'>Open to relocation?</span>
            <span className={`text-body-medium ${styles.infoRowValue}`}>
              {toRelocationLabel(tp)}
            </span>
          </div>

          {tp.availabilityLabel ? (
            <div className={styles.infoRow}>
              <span className='content-muted text-title-small shrink-0'>Availability</span>
              <span className={`text-body-medium ${styles.infoRowValue}`}>
                {tp.availabilityLabel}
                {tp.preferredJobTypeLabel ? ` \u00B7 ${tp.preferredJobTypeLabel}` : ''}
              </span>
            </div>
          ) : null}
        </div>

        {tp.jobFunctionLabels.length > 0 ? (
          <div className={styles.applicantDetailSection}>
            <div className='text-heading-small'>Job functions</div>
            <div className='flex-wrap gap-xxsmall flex'>
              {tp.jobFunctionLabels.map((label) => (
                <Badge key={label} label={label} variant='Neutral' />
              ))}
            </div>
          </div>
        ) : null}

        {tp.skillTags.length > 0 ? (
          <div className={styles.applicantDetailSection}>
            <div className='text-heading-small'>Skills</div>
            <div className='flex-wrap gap-xxsmall flex'>
              {tp.skillTags.map((tag) => (
                <Badge key={tag} label={tag} variant='Neutral' />
              ))}
            </div>
          </div>
        ) : null}

        <div className={styles.applicantDetailSection}>
          <ProfileCreations workExperiences={tp.workExperiences} size='large' />
        </div>

        <div className={styles.applicantDetailSection}>
          <TalentSignal applicationId={applicant.id} />
        </div>
      </div>

      <div className={styles.detailPanelFooter}>
        <div className={styles.detailPanelActions}>
          {applicant.favorite ? (
            <Button variant='Standard' size='Medium' onClick={onNotInterested}>
              <span className={styles.starButtonContent}>
                <Icon name='icon-filled-star' size='Small' />
                <span>Starred</span>
              </span>
            </Button>
          ) : (
            <Button variant='Standard' size='Medium' onClick={onInterested}>
              <span className={styles.starButtonContent}>
                <Icon name='icon-regular-star' size='Small' />
                <span>Add to starred</span>
              </span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicantDetailSheet;
