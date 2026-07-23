import React, { useState } from 'react';
import { Button, Icon, Tooltip, TooltipTrigger, clsx } from '@rbx/foundation-ui';
import type { JobViewModel } from '../../types';
import { LOGO_SIZE_MEDIUM, LOGO_SIZE_LARGE } from '../../constants';
import PlaceholderImage from '../shared/PlaceholderImage';
import CloseJobDialog from './CloseJobDialog';
import styles from '../shared/Layout.module.css';

type JobDetailPanelProps = {
  job: JobViewModel;
  mode?: 'page' | 'drawer';
  onClose?: () => void;
  onApply?: () => void;
  onEditPost?: () => void;
  onBack?: () => void;
  backLabel?: string;
  applyLabel?: string;
  isApplyDisabled?: boolean;
  showApplyAction?: boolean;
  applyDisabledTooltip?: string;
  isOwner?: boolean;
};

function splitToBullets(text?: string | null): Array<{ key: string; text: string }> {
  if (!text) return [];
  const seen = new Map<string, number>();
  return text
    .split(/\n|•/g)
    .map((value) => value.trim())
    .filter(Boolean)
    .map((item) => {
      const count = seen.get(item) ?? 0;
      seen.set(item, count + 1);
      return { key: count > 0 ? `${item}-${count}` : item, text: item };
    });
}

export const JobDetailPanel: React.FC<JobDetailPanelProps> = ({
  job,
  mode = 'page',
  onClose,
  onApply,
  onEditPost,
  onBack,
  backLabel,
  applyLabel = 'Apply',
  isApplyDisabled = false,
  showApplyAction = true,
  applyDisabledTooltip,
  isOwner = false,
}) => {
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const isDrawer = mode === 'drawer';
  const responsibilities = splitToBullets(job.responsibilities);
  const requirements = splitToBullets(job.qualifications);

  const infoTable = (
    <div className='flex flex-col padding-y-large'>
      <div className={styles.sectionHeader}>
        <span className='text-heading-small'>Information</span>
      </div>
      <div className={styles.infoRow}>
        <span className='text-body-medium content-muted shrink-0'>Job type</span>
        <span className={`text-body-medium ${styles.infoRowValue}`}>{job.jobTypeLabel}</span>
      </div>
      <div className={styles.infoRow}>
        <span className='text-body-medium content-muted shrink-0'>Location</span>
        <span className={`text-body-medium ${styles.infoRowValue}`}>{job.locationLabel}</span>
      </div>
    </div>
  );

  const aboutStudio = (
    <div className={clsx('flex flex-col gap-medium padding-y-xlarge', styles.borderedSection)}>
      <div className='text-heading-small'>{`About ${job.studioName ?? 'Studio'}`}</div>
      <div className='text-body-medium content-muted'>{job.studioDescription ?? '\u2014'}</div>
    </div>
  );

  const aboutRole = (
    <div className={clsx('flex flex-col gap-medium padding-y-xlarge', styles.borderedSection)}>
      <div className='text-heading-small'>About the role</div>
      <div className='text-body-medium content-muted'>{job.description ?? '\u2014'}</div>
    </div>
  );

  const responsibilitiesSection = (
    <div className={clsx('flex flex-col gap-medium padding-y-xlarge', styles.borderedSection)}>
      <div className='text-heading-small'>Responsibilities</div>
      {responsibilities.length > 0 ? (
        <ul
          className={clsx(
            'list-disc padding-left-medium text-body-medium content-muted',
            styles.bulletList,
          )}>
          {responsibilities.map((item) => (
            <li key={item.key}>{item.text}</li>
          ))}
        </ul>
      ) : (
        <div className='text-body-medium content-muted'>{'\u2014'}</div>
      )}
    </div>
  );

  const requirementsSection = (
    <div className={clsx('flex flex-col gap-medium padding-y-xlarge', styles.borderedSection)}>
      <div className='text-heading-small'>Requirements</div>
      {requirements.length > 0 ? (
        <ul
          className={clsx(
            'list-disc padding-left-medium text-body-medium content-muted',
            styles.bulletList,
          )}>
          {requirements.map((item) => (
            <li key={item.key}>{item.text}</li>
          ))}
        </ul>
      ) : (
        <div className='text-body-medium content-muted'>{'\u2014'}</div>
      )}
    </div>
  );

  let headerActions: React.ReactNode = null;
  let footerAction: React.ReactNode = null;

  if (isOwner) {
    const ownerButtons = (isFooter: boolean) => (
      <div className={isFooter ? styles.detailPanelActions : styles.pageHeaderActions}>
        <Button variant='Emphasis' size='Medium' onClick={onEditPost}>
          Edit job
        </Button>
        <Button variant='Standard' size='Medium' onClick={() => setIsCloseDialogOpen(true)}>
          Close job
        </Button>
      </div>
    );

    if (isDrawer) {
      footerAction = ownerButtons(true);
    } else {
      headerActions = ownerButtons(false);
    }
  } else if (showApplyAction) {
    const applyButton =
      isApplyDisabled && applyDisabledTooltip ? (
        <Tooltip position='top-center' title={applyDisabledTooltip}>
          <TooltipTrigger asChild>
            <span className='flex flex-1'>
              <Button variant='Emphasis' size='Medium' isDisabled className='width-full'>
                {applyLabel}
              </Button>
            </span>
          </TooltipTrigger>
        </Tooltip>
      ) : (
        <Button variant='Emphasis' size='Medium' onClick={onApply} isDisabled={isApplyDisabled}>
          {applyLabel}
        </Button>
      );

    const applyCloseButtons = (isFooter: boolean) => (
      <div className={isFooter ? styles.detailPanelActions : styles.pageHeaderActions}>
        {applyButton}
        {isDrawer && onClose ? (
          <Button variant='Standard' size='Medium' onClick={onClose}>
            Close
          </Button>
        ) : null}
      </div>
    );

    if (isDrawer) {
      footerAction = applyCloseButtons(true);
    } else {
      headerActions = applyCloseButtons(false);
    }
  }

  const header = (
    <div className='flex flex-col gap-medium'>
      <div
        className={
          isDrawer ? 'flex items-start gap-medium min-width-0 justify-between' : styles.pageHeader
        }>
        <div
          className={`flex items-start min-width-0 ${isDrawer ? 'gap-medium' : 'gap-small small:gap-large'}`}>
          {job.studioLogo ? (
            <div
              className={`clip shrink-0 ${isDrawer ? 'radius-small' : 'radius-medium'}`}
              style={{
                width: isDrawer ? LOGO_SIZE_MEDIUM : LOGO_SIZE_LARGE,
                height: isDrawer ? LOGO_SIZE_MEDIUM : LOGO_SIZE_LARGE,
              }}>
              <img
                src={job.studioLogo}
                alt=''
                className={clsx('width-full height-full', styles.objectCover)}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          ) : (
            <PlaceholderImage
              size={isDrawer ? LOGO_SIZE_MEDIUM : LOGO_SIZE_LARGE}
              className={isDrawer ? 'radius-small' : 'radius-medium'}
            />
          )}
          <div className={`flex flex-col min-width-0 ${isDrawer ? 'gap-xxsmall' : 'gap-xsmall'}`}>
            <div className={isDrawer ? 'text-heading-small' : 'text-heading-medium'}>
              {job.title}
            </div>
            <div className='flex items-center gap-xsmall flex-wrap'>
              <span
                className={
                  isDrawer ? 'text-body-small content-muted' : 'text-title-medium content-muted'
                }>
                {job.studioName ?? 'Studio'}
              </span>
              <span className={styles.verifiedBadge}>
                <Icon name='icon-filled-verified-mono' size='Small' />
              </span>
            </div>
          </div>
        </div>
        {headerActions ? <div className='flex-shrink-0'>{headerActions}</div> : null}
      </div>
    </div>
  );

  return (
    <div className='flex flex-col height-full' data-testid='job-detail-panel'>
      {isDrawer && (
        <div className={styles.sheetHandle}>
          <div className={styles.sheetHandleBar} />
        </div>
      )}
      <div className={styles.detailPanelBody}>
        {!isDrawer && onBack && (
          <div className='margin-bottom-small'>
            <Button variant='Utility' size='Small' onClick={onBack}>
              <span className='flex items-center gap-xxsmall'>
                <Icon name='icon-regular-chevron-small-left' size='Small' />
                <span>{backLabel ?? 'Back'}</span>
              </span>
            </Button>
          </div>
        )}

        <div className='flex flex-col gap-large'>
          {header}
          {infoTable}
          {aboutStudio}
          {aboutRole}
          {responsibilitiesSection}
          {requirementsSection}
        </div>
      </div>

      {footerAction ? <div className={styles.detailPanelFooter}>{footerAction}</div> : null}
      <CloseJobDialog open={isCloseDialogOpen} onClose={() => setIsCloseDialogOpen(false)} />
    </div>
  );
};

export default JobDetailPanel;
