import React, { useCallback, useState } from 'react';
import { Button, Icon } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { resumeClient } from '../../api/resumeClient';
import { downloadMockResume, downloadResumeUrl } from '../../api/resumeDownload';
import type { ApiResume } from '../../types';
import { isMocksEnabled } from '../../utils';
import dialogStyles from '../shared/Layout.module.css';

export const ReviewResumeSection: React.FC<{
  resumes: ApiResume[];
  selectedResumeId?: string;
  onEdit: () => void;
}> = ({ resumes, selectedResumeId, onEdit }) => {
  const { translate } = useTranslation();
  const [resumeDownloadError, setResumeDownloadError] = useState<string | null>(null);
  const tr = useCallback(
    (key: string, fallback: string) => {
      const value = translate(key);
      return value && value !== key ? value : fallback;
    },
    [translate],
  );
  const handleDownload = useCallback(
    async (resume: ApiResume) => {
      setResumeDownloadError(null);
      try {
        if (isMocksEnabled()) {
          downloadMockResume(resume.fileName || 'resume');
          return;
        }
        const { downloadUrl } = await resumeClient.getDownloadUrl(resume.id);
        if (!downloadUrl) {
          throw new Error('Missing resume download URL');
        }
        await downloadResumeUrl(downloadUrl, resume.fileName || 'resume');
      } catch {
        setResumeDownloadError(
          tr('Error.FailedToDownloadResume', 'Unable to download resume. Please try again.'),
        );
      }
    },
    [tr],
  );

  const visibleResumes = selectedResumeId
    ? resumes.filter((r) => r.id === selectedResumeId)
    : resumes;

  return (
    <div className='gap-medium flex flex-col'>
      <div className='items-center justify-between flex'>
        <span className='text-title-large'>{tr('Label.Resume', 'Resume')}</span>
        <Button variant='Utility' size='Small' onClick={onEdit}>
          {tr('Action.Edit', 'Edit')}
        </Button>
      </div>

      {visibleResumes.length > 0 ? (
        <div className='width-full gap-small flex flex-col'>
          {visibleResumes.map((r) => (
            <div
              key={r.id}
              className='border items-center padding-small gap-small radius-medium flex'>
              <Icon name='icon-regular-page' size='Small' />
              <div className='flex-1 min-width-0 flex flex-col'>
                <span className='text-body-medium text-truncate-end'>{r.fileName}</span>
                {r.confirmedAt ? (
                  <span className='content-muted text-body-small'>
                    {tr('Text.ResumeLastUsedOnPrefix', 'Last used on')}{' '}
                    {new Date(r.confirmedAt).toLocaleDateString(undefined, {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                ) : null}
              </div>
              <button
                type='button'
                className={dialogStyles.resumeDownloadButton}
                onClick={() => handleDownload(r)}
                aria-label={tr('Aria.DownloadResume', 'Download resume')}>
                <Icon name='icon-regular-arrow-down-to-line' size='Medium' />
              </button>
            </div>
          ))}
          {resumeDownloadError ? (
            <span className='content-alert text-body-small'>{resumeDownloadError}</span>
          ) : null}
        </div>
      ) : (
        <span className='content-muted text-body-small'>
          {tr('Text.NoResumeAttached', 'No resume attached.')}
        </span>
      )}
    </div>
  );
};
