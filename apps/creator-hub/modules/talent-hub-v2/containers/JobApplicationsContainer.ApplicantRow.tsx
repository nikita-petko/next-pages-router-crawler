import React, { useCallback } from 'react';
import { Icon, clsx } from '@rbx/foundation-ui';
import { Thumbnail2d, ThumbnailTypes, ReturnPolicy } from '@rbx/thumbnails';
import type { ApplicantRowViewModel } from '../types';
import styles from '../components/shared/Layout.module.css';

export type ApplicantRowProps = {
  applicant: ApplicantRowViewModel;
  isSelected?: boolean;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string, favorite: boolean) => void;
};

export const ApplicantRow: React.FC<ApplicantRowProps> = ({
  applicant,
  isSelected,
  onSelect,
  onToggleFavorite,
}) => {
  const handleClick = useCallback(() => {
    onSelect(applicant.id);
  }, [onSelect, applicant.id]);

  const handleFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleFavorite(applicant.id, !applicant.favorite);
    },
    [onToggleFavorite, applicant.id, applicant.favorite],
  );

  return (
    <tr
      className={clsx(
        styles.applicantTableRow,
        !applicant.viewed && styles.applicantTableRowUnread,
        isSelected && styles.applicantTableRowSelected,
      )}
      onClick={handleClick}
      data-testid={`applicant-row-${applicant.id}`}>
      <td>
        <span
          className={clsx(
            'text-body-medium',
            !applicant.viewed ? 'font-weight-bold content-emphasis' : 'content-default',
          )}>
          {applicant.talentName || '\u2014'}
        </span>
      </td>
      <td>
        <div className='items-center gap-small flex'>
          {applicant.talentUserId !== undefined ? (
            <div className={styles.applicantAvatar}>
              <Thumbnail2d
                targetId={applicant.talentUserId}
                type={ThumbnailTypes.avatarHeadshot}
                alt={applicant.talentName || 'Applicant'}
                returnPolicy={ReturnPolicy.PlaceHolder}
                containerClass={styles.thumbnailFill}
                imgClassName={styles.thumbnailFillImg}
              />
            </div>
          ) : (
            <div className={styles.applicantAvatar} aria-hidden />
          )}
          <span
            className={clsx(
              'text-body-medium',
              !applicant.viewed ? 'content-default' : 'content-muted',
            )}>
            {applicant.talentUsername ? `@${applicant.talentUsername}` : '\u2014'}
          </span>
        </div>
      </td>
      <td>
        <span
          className={clsx(
            'text-body-small',
            !applicant.viewed ? 'content-default' : 'content-muted',
          )}>
          {applicant.submittedAt
            ? new Date(applicant.submittedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })
            : '\u2014'}
        </span>
      </td>
      <td className={clsx('text-right', styles.starCell)}>
        <button
          type='button'
          className={styles.buttonReset}
          onClick={handleFavorite}
          aria-label={applicant.favorite ? 'Remove from starred' : 'Add to starred'}>
          <Icon name={applicant.favorite ? 'icon-filled-star' : 'icon-regular-star'} size='Small' />
        </button>
      </td>
    </tr>
  );
};
