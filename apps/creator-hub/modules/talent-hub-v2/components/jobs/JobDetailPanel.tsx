import React, { useState } from 'react';
import {
  Button,
  Icon,
  IconButton,
  Menu,
  MenuItem,
  MenuSection,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipTrigger,
  clsx,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { LOGO_SIZE_MEDIUM, LOGO_SIZE_LARGE } from '../../constants';
import type { JobViewModel } from '../../types';
import type { ApplyDisabledBanner } from '../../utils';
import StudioLogo from '../shared/StudioLogo';
import VerifiedBadgeIcon from '../shared/VerifiedBadgeIcon';
import CloseJobDialog from './CloseJobDialog';
import styles from '../shared/Layout.module.css';

type JobDetailPanelProps = {
  job: JobViewModel;
  mode?: 'page' | 'drawer';
  onClose?: () => void;
  onApply?: () => void;
  onEditPost?: () => void;
  onGoToApplications?: () => void;
  onBack?: () => void;
  backLabel?: string;
  applyLabel?: string;
  isApplyDisabled?: boolean;
  showApplyAction?: boolean;
  applyDisabledTooltip?: string;
  applyDisabledBanner?: ApplyDisabledBanner;
  isOwner?: boolean;
  studioHref?: string;
  hideStudioHeader?: boolean;
  hideTitleHeader?: boolean;
  hideSectionDividers?: boolean;
  headerSupplement?: React.ReactNode;
};

function splitToBullets(text?: string | null): Array<{ key: string; text: string }> {
  if (!text) {
    return [];
  }
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
  onGoToApplications,
  onBack,
  backLabel,
  applyLabel,
  isApplyDisabled = false,
  showApplyAction = true,
  applyDisabledTooltip,
  applyDisabledBanner,
  isOwner = false,
  studioHref,
  hideStudioHeader = false,
  hideTitleHeader = false,
  hideSectionDividers = false,
  headerSupplement,
}) => {
  const { translate } = useTranslation();
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const isDrawer = mode === 'drawer';
  const responsibilities = splitToBullets(job.responsibilities);
  const requirements = splitToBullets(job.qualifications);
  const labelOrFallback = (key: string, fallback: string) => {
    const text = translate(key);
    if (!text || !text.trim()) {
      return fallback;
    }
    if (text === key) {
      return fallback;
    }
    if (text.startsWith('<') && text.endsWith('>')) {
      return fallback;
    }
    return text;
  };

  const infoTable = (
    <div className={clsx('flex flex-col padding-y-large', styles.jobDetailInfoSection)}>
      <div className={styles.sectionHeader}>
        <span className='text-heading-small'>{translate('Heading.Information')}</span>
      </div>
      <div className={styles.infoRow}>
        <span className='text-body-medium content-muted shrink-0'>
          {translate('Label.JobType')}
        </span>
        <span className={`text-body-medium ${styles.infoRowValue}`}>{job.jobTypeLabel}</span>
      </div>
      <div className={styles.infoRow}>
        <span className='text-body-medium content-muted shrink-0'>
          {translate('Label.Location')}
        </span>
        <span className={`text-body-medium ${styles.infoRowValue}`}>{job.locationLabel}</span>
      </div>
    </div>
  );

  const sectionClass = hideSectionDividers
    ? 'flex flex-col gap-medium padding-y-large'
    : clsx('flex flex-col gap-medium padding-y-xlarge', styles.borderedSection);

  const aboutRole = (
    <div className={sectionClass}>
      <div className='text-heading-small'>{translate('Heading.AboutTheRole')}</div>
      <div className={clsx('text-body-medium content-muted', styles.preWrapText)}>
        {job.description ?? '\u2014'}
      </div>
    </div>
  );

  const responsibilitiesSection = (
    <div className={sectionClass}>
      <div className='text-heading-small'>{translate('Heading.Responsibilities')}</div>
      {responsibilities.length > 0 ? (
        <ul
          className={clsx(
            'list-disc padding-left-medium text-body-medium content-muted',
            styles.bulletList,
            styles.preWrapText,
          )}>
          {responsibilities.map((item) => (
            <li key={item.key}>{item.text}</li>
          ))}
        </ul>
      ) : (
        <div className={clsx('text-body-medium content-muted', styles.preWrapText)}>{'\u2014'}</div>
      )}
    </div>
  );

  const requirementsSection = (
    <div className={sectionClass}>
      <div className='text-heading-small'>{translate('Heading.Requirements')}</div>
      {requirements.length > 0 ? (
        <ul
          className={clsx(
            'list-disc padding-left-medium text-body-medium content-muted',
            styles.bulletList,
            styles.preWrapText,
          )}>
          {requirements.map((item) => (
            <li key={item.key}>{item.text}</li>
          ))}
        </ul>
      ) : (
        <div className={clsx('text-body-medium content-muted', styles.preWrapText)}>{'\u2014'}</div>
      )}
    </div>
  );

  let headerActions: React.ReactNode = null;
  let footerAction: React.ReactNode = null;

  if (isOwner) {
    const ownerButtons = (isFooter: boolean) => (
      <div className={isFooter ? styles.detailPanelActions : styles.pageHeaderActions}>
        <Button variant='Emphasis' size='Medium' onClick={onEditPost}>
          {translate('Action.EditJob')}
        </Button>
        <Button
          variant='Standard'
          size='Medium'
          onClick={isDrawer && onClose ? onClose : () => setIsCloseDialogOpen(true)}>
          {isDrawer ? translate('Action.Close') : translate('Action.CloseJob')}
        </Button>
      </div>
    );

    if (isDrawer) {
      footerAction = ownerButtons(true);
    } else {
      const ownerMenuLabel = labelOrFallback('Action.MoreOptions', 'More options');
      headerActions = (
        <Popover>
          <PopoverTrigger asChild>
            <IconButton
              as='button'
              variant='Utility'
              size='Medium'
              icon='icon-regular-three-dots-vertical'
              ariaLabel={ownerMenuLabel}
            />
          </PopoverTrigger>
          <PopoverContent
            side='bottom'
            align='end'
            ariaLabel={ownerMenuLabel}
            className={styles.jobOwnerActionsMenu}>
            <Menu size='Medium'>
              <MenuSection>
                <MenuItem
                  value='edit-post'
                  title={labelOrFallback('Action.EditPost', 'Edit post')}
                  onSelect={onEditPost}
                  disabled={!onEditPost}
                />
                <MenuItem
                  value='close-job'
                  title={labelOrFallback('Action.CloseJob', 'Close job')}
                  onSelect={() => setIsCloseDialogOpen(true)}
                />
                <MenuItem
                  value='go-to-applications'
                  title={labelOrFallback('Action.GoToApplications', 'Go to applications')}
                  onSelect={onGoToApplications}
                  disabled={!onGoToApplications}
                />
              </MenuSection>
            </Menu>
          </PopoverContent>
        </Popover>
      );
    }
  } else if (showApplyAction) {
    const applyButton =
      isApplyDisabled && applyDisabledTooltip ? (
        <Tooltip
          position='top-center'
          title={applyDisabledTooltip}
          contentClassName={styles.applyDisabledTooltipContent}>
          <TooltipTrigger asChild>
            <span className='flex flex-1'>
              <Button variant='Emphasis' size='Medium' isDisabled className='width-full'>
                {applyLabel ?? translate('Action.Apply')}
              </Button>
            </span>
          </TooltipTrigger>
        </Tooltip>
      ) : (
        <Button variant='Emphasis' size='Medium' onClick={onApply} isDisabled={isApplyDisabled}>
          {applyLabel ?? translate('Action.Apply')}
        </Button>
      );

    const applyCloseButtons = (isFooter: boolean) => (
      <div className={isFooter ? styles.detailPanelActions : styles.pageHeaderActions}>
        {applyButton}
        {isDrawer && onClose ? (
          <Button variant='Standard' size='Medium' onClick={onClose}>
            {translate('Action.Close')}
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

  let titleClass = 'text-heading-medium';
  if (hideStudioHeader) {
    titleClass = 'text-heading-large';
  } else if (isDrawer) {
    titleClass = 'text-heading-small';
  }

  const resolvedStudioHref =
    studioHref ?? (job.studioId ? `/hire/studios/${job.studioId}?from=jobs` : '/hire/studios');

  const header = hideTitleHeader ? null : (
    <div className='flex flex-col gap-medium'>
      <div
        className={
          isDrawer ? 'flex items-start gap-medium min-width-0 justify-between' : styles.pageHeader
        }>
        <div
          className={`flex items-start min-width-0 ${isDrawer ? 'gap-medium' : 'gap-small small:gap-large'}`}>
          {!hideStudioHeader && (
            <StudioLogo
              logo={job.studioLogo}
              groupId={job.studioGroupId}
              size={isDrawer ? LOGO_SIZE_MEDIUM : LOGO_SIZE_LARGE}
              className={isDrawer ? 'radius-small' : 'radius-medium'}
            />
          )}
          <div className={`flex flex-col min-width-0 ${isDrawer ? 'gap-xxsmall' : 'gap-xsmall'}`}>
            <div className={titleClass}>{job.title}</div>
            {!hideStudioHeader && (
              <div className='flex items-center gap-xsmall flex-wrap'>
                <a
                  href={resolvedStudioHref}
                  className={clsx('text-body-large content-default', styles.linkReset)}
                  onClick={(e) => e.stopPropagation()}>
                  {job.studioName ?? translate('Label.Studio')}
                </a>
                <VerifiedBadgeIcon size='medium' />
              </div>
            )}
          </div>
        </div>
        {headerActions ? <div className='flex-shrink-0'>{headerActions}</div> : null}
      </div>
      {headerSupplement}
    </div>
  );

  const applyBanner = applyDisabledBanner ? (
    <div className={styles.detailPanelBanner}>
      <span className={styles.detailPanelBannerIcon} aria-hidden='true'>
        <span className={styles.detailPanelBannerIconGlyph}>!</span>
      </span>
      <span
        className={clsx(
          'text-body-medium content-emphasis',
          styles.detailPanelBannerText,
          applyDisabledBanner.actionHref
            ? styles.detailPanelBannerTextWithAction
            : styles.detailPanelBannerTextNoAction,
        )}>
        {applyDisabledBanner.message}
      </span>
      {applyDisabledBanner.actionHref ? (
        <Button
          as='a'
          href={applyDisabledBanner.actionHref}
          target={applyDisabledBanner.external ? '_blank' : undefined}
          rel={applyDisabledBanner.external ? 'noreferrer' : undefined}
          variant='Standard'
          size='Small'
          className={styles.applyDisabledBannerActionButton}>
          <span className={clsx('flex items-center', styles.applyDisabledBannerActionButtonLabel)}>
            <span>{applyDisabledBanner.actionLabel}</span>
          </span>
        </Button>
      ) : null}
    </div>
  ) : null;

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
                <span>{backLabel ?? translate('Action.Back')}</span>
              </span>
            </Button>
          </div>
        )}

        <div className='flex flex-col gap-large'>
          {header}
          {infoTable}
          {aboutRole}
          {responsibilitiesSection}
          {requirementsSection}
        </div>
      </div>

      {footerAction || applyBanner ? (
        <div className={styles.detailPanelFooter}>
          {footerAction}
          {applyBanner}
        </div>
      ) : null}
      <CloseJobDialog
        open={isCloseDialogOpen}
        jobId={job.id}
        onClose={() => setIsCloseDialogOpen(false)}
      />
    </div>
  );
};

export default JobDetailPanel;
