import React, { useCallback, useRef, useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Icon,
  clsx,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { MAX_RESUME_FILE_SIZE_MB } from '../../hooks/useResumes';
import type { ApiResume } from '../../types';
import { TalentSignal } from '../signal/TalentSignal';
import styles from '../shared/Layout.module.css';

/**
 * Apply-flow step 2: pick a resume and decide whether to attach platform
 * signals. `<TalentSignal />` owns the opt-in UI and preview content.
 */

const MAX_VISIBLE_RESUMES = 3;
const UPLOAD_ERROR_FALLBACKS: Record<string, string> = {
  'Error.ResumePdfOnly': 'Only PDF files are accepted.',
  'Error.ResumeFileTooLarge': `File must be under ${MAX_RESUME_FILE_SIZE_MB} MB.`,
  'Error.ResumeUploadFailed': 'Upload failed. Please try again.',
};
const PRIVACY_POLICY_URL =
  'https://en.help.roblox.com/hc/en-us/articles/115004630823-Roblox-Privacy-and-Cookie-Policy';

type ResumeStatsStepProps = {
  resumes: ApiResume[];
  selectedResumeId?: string;
  onSelectResume: (id: string | undefined) => void;
  isUploading: boolean;
  uploadError: string | null;
  onUpload: (file: File) => void;
  onDownloadResume: (resume: ApiResume) => void;
  onDeleteResume: (resume: ApiResume) => void;
  isDeletingResume?: boolean;
  includeSignals: boolean;
  onChangeIncludeSignals: (value: boolean) => void;
  resumeError?: string | null;
};

const ResumeRow: React.FC<{
  resume: ApiResume;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDownload: (resume: ApiResume) => void;
  onRequestDelete: (resume: ApiResume) => void;
  lastUsedOnLabel: string;
  downloadResumeLabel: string;
  deleteResumeLabel: string;
}> = ({
  resume,
  isSelected,
  onSelect,
  onDownload,
  onRequestDelete,
  lastUsedOnLabel,
  downloadResumeLabel,
  deleteResumeLabel,
}) => {
  const handleSelect = () => onSelect(resume.id);

  return (
    <div
      role='button'
      tabIndex={0}
      onClick={handleSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleSelect();
        }
      }}
      aria-pressed={isSelected}
      className={clsx(
        styles.buttonReset,
        styles.resumeRow,
        isSelected && styles.resumeRowSelected,
      )}>
      <Icon name='icon-regular-page' size='Small' />
      <div className='flex-1 min-width-0 flex flex-col'>
        <span className='text-body-medium text-truncate-end'>{resume.fileName}</span>
        {resume.confirmedAt ? (
          <span className='content-muted text-body-small'>
            {lastUsedOnLabel}{' '}
            {new Date(resume.confirmedAt).toLocaleDateString(undefined, {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        ) : null}
      </div>
      <button
        type='button'
        className={styles.resumeDownloadButton}
        onClick={(e) => {
          e.stopPropagation();
          onDownload(resume);
        }}
        aria-label={downloadResumeLabel}>
        <Icon name='icon-regular-arrow-down-to-line' size='Medium' />
      </button>
      <button
        type='button'
        className={styles.resumeDeleteButton}
        onClick={(e) => {
          e.stopPropagation();
          onRequestDelete(resume);
        }}
        aria-label={deleteResumeLabel}>
        <Icon name='icon-regular-trash-can' size='Medium' />
      </button>
    </div>
  );
};

export const ResumeStatsStep: React.FC<ResumeStatsStepProps> = ({
  resumes,
  selectedResumeId,
  onSelectResume,
  isUploading,
  uploadError,
  onUpload,
  onDownloadResume,
  onDeleteResume,
  isDeletingResume = false,
  includeSignals,
  onChangeIncludeSignals,
  resumeError,
}) => {
  const { translate } = useTranslation();
  const tr = (key: string, fallback: string) => {
    const value = translate(key);
    return value && value !== key ? value : fallback;
  };
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAllResumes, setShowAllResumes] = useState(false);
  const [resumePendingDelete, setResumePendingDelete] = useState<ApiResume | null>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onUpload(file);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [onUpload],
  );

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleCheckboxChange = useCallback(
    (checked: boolean | 'indeterminate') => {
      onChangeIncludeSignals(checked === true);
    },
    [onChangeIncludeSignals],
  );

  const visibleResumes = showAllResumes ? resumes : resumes.slice(0, MAX_VISIBLE_RESUMES);
  const handleConfirmDelete = useCallback(() => {
    if (!resumePendingDelete) {
      return;
    }
    onDeleteResume(resumePendingDelete);
    setResumePendingDelete(null);
  }, [onDeleteResume, resumePendingDelete]);
  const handleDeleteDialogOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      setResumePendingDelete(null);
    }
  }, []);

  return (
    <div className='width-full gap-medium flex flex-col'>
      <div className='width-full gap-small flex flex-col'>
        <div className='gap-xxsmall flex flex-col'>
          <div className='text-title-large'>{tr('Label.Resume', 'Resume')}</div>
          <div className='content-muted text-body-small'>
            {tr(
              'Description.ResumeUploadRequirements',
              `Upload a PDF file up to ${MAX_RESUME_FILE_SIZE_MB} MB.`,
            )}
          </div>
        </div>

        {visibleResumes.length > 0 ? (
          <div className='width-full gap-xsmall flex flex-col'>
            {visibleResumes.map((r) => (
              <ResumeRow
                key={r.id}
                resume={r}
                isSelected={r.id === selectedResumeId}
                onSelect={(id) => onSelectResume(id)}
                onDownload={onDownloadResume}
                onRequestDelete={setResumePendingDelete}
                lastUsedOnLabel={tr('Text.ResumeLastUsedOnPrefix', 'Last used on')}
                downloadResumeLabel={tr('Aria.DownloadResume', 'Download resume')}
                deleteResumeLabel={tr('Aria.DeleteResume', 'Delete resume')}
              />
            ))}
          </div>
        ) : (
          <div className='content-muted text-body-small'>
            {tr(
              'Description.UploadResumeRequiredForApplication',
              'Upload a resume to continue with your application.',
            )}
          </div>
        )}

        <div className='items-center justify-between flex'>
          <Button
            variant='Standard'
            size='Medium'
            onClick={handleUploadClick}
            isLoading={isUploading}>
            {tr('Action.Upload', 'Upload')}
          </Button>
          {resumes.length > MAX_VISIBLE_RESUMES && !showAllResumes ? (
            <button
              type='button'
              className={clsx(styles.buttonReset, 'content-link text-body-medium')}
              onClick={() => setShowAllResumes(true)}>
              {tr('Action.ShowMore', 'Show more')}
            </button>
          ) : null}
        </div>

        {uploadError ? (
          <div className='content-alert text-body-small'>
            {tr(
              uploadError,
              UPLOAD_ERROR_FALLBACKS[uploadError] ?? 'Upload failed. Please try again.',
            )}
          </div>
        ) : null}
        {resumeError ? <div className='content-alert text-body-small'>{resumeError}</div> : null}

        <div className='content-muted text-body-small'>
          {tr(
            'Description.ResumeUploadConsentPrefix',
            'By uploading your resume, you consent to Roblox processing and providing this information to the creator for purposes of using TalentHub. Data handling is subject to our',
          )}{' '}
          <a href={PRIVACY_POLICY_URL} target='_blank' rel='noreferrer'>
            {tr('Link.PrivacyPolicy', 'Privacy Policy')}
          </a>
          <span>.</span>
        </div>

        <input
          ref={fileInputRef}
          type='file'
          accept='.pdf'
          data-testid='resume-upload-input'
          className='hidden'
          onChange={handleFileChange}
        />
      </div>

      <Divider />

      <TalentSignal isOptedIn={includeSignals} onOptInChange={handleCheckboxChange} />

      <Dialog
        open={Boolean(resumePendingDelete)}
        onOpenChange={handleDeleteDialogOpenChange}
        size='Small'
        isModal
        hasCloseAffordance={false}>
        <DialogContent>
          <div className='padding-large gap-medium flex flex-col'>
            <DialogTitle className='text-heading-medium margin-none'>
              {tr('Heading.DeleteResume', 'Delete resume')}
            </DialogTitle>
            <div className='content-muted text-body-medium'>
              {tr(
                'Description.DeleteResumeConfirmation',
                'Are you sure you want to delete your resume?',
              )}
            </div>
            {resumePendingDelete?.fileName ? (
              <div className='text-body-medium text-truncate-end'>
                {resumePendingDelete.fileName}
              </div>
            ) : null}
            <div className={`margin-top-small gap-small flex ${styles.equalButtons}`}>
              <Button
                variant='Alert'
                size='Medium'
                onClick={handleConfirmDelete}
                isLoading={isDeletingResume}
                isDisabled={!resumePendingDelete}>
                {tr('Action.Delete', 'Delete')}
              </Button>
              <Button
                variant='Standard'
                size='Medium'
                onClick={() => setResumePendingDelete(null)}
                isDisabled={isDeletingResume}>
                {tr('Action.Cancel', 'Cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResumeStatsStep;
