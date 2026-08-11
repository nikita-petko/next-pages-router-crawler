import type { FunctionComponent } from 'react';
import { StatusBadge } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { PresetStatus } from '../types';

type QuickWordsStatusBadgeProps = {
  status: PresetStatus;
};

const QuickWordsStatusBadge: FunctionComponent<QuickWordsStatusBadgeProps> = ({ status }) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());

  switch (status) {
    case 'APPROVED':
      return (
        <StatusBadge
          size='Small'
          variant='Success'
          label={tPendingTranslation(
            'Approved',
            'Badge label for approved status',
            translationKey('Status.Approved', TranslationNamespace.PresetChat),
          )}
        />
      );
    case 'FAILED_PUBLISH':
      return (
        <StatusBadge
          size='Small'
          variant='Alert'
          label={tPendingTranslation(
            'Not approved',
            'Badge label for not approved status',
            translationKey('Status.NotApproved', TranslationNamespace.PresetChat),
          )}
        />
      );
    case 'PUBLISHING':
      return (
        <StatusBadge
          size='Small'
          variant='Standard'
          label={tPendingTranslation(
            'Pending',
            'Badge label for pending review status',
            translationKey('Status.Pending', TranslationNamespace.PresetChat),
          )}
        />
      );
    case 'DRAFT':
    case 'ROBLOX_DEFAULT':
    case 'RESET_TO_DEFAULTS':
    default:
      return (
        <StatusBadge
          size='Small'
          variant='Standard'
          label={tPendingTranslation(
            'Draft',
            'Badge label for draft status',
            translationKey('Status.Draft', TranslationNamespace.PresetChat),
          )}
        />
      );
  }
};

export default QuickWordsStatusBadge;
