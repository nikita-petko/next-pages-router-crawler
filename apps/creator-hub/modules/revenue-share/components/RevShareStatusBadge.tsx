import type { FunctionComponent } from 'react';
import type { TTailwindIconClass } from '@rbx/foundation-tailwind/classes';
import { Badge, type TBadgeVariant } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { RevShareConfirmationStatus } from '../interface/RevShareViewModel';

type StatusContent = {
  variant: TBadgeVariant;
  icon: TTailwindIconClass;
};

type DisplayableRevShareStatus = Exclude<
  RevShareConfirmationStatus,
  RevShareConfirmationStatus.AutoAccepted
>;

// RevShareConfirmationStatus to badge content. AutoAccepted has no consent signal, so it renders nothing.
const STATUS_TO_CONTENT = {
  [RevShareConfirmationStatus.Accepted]: {
    variant: 'Success',
    icon: 'icon-regular-circle-check',
  },
  [RevShareConfirmationStatus.Pending]: {
    variant: 'Warning',
    icon: 'icon-regular-clock',
  },
  [RevShareConfirmationStatus.Declined]: {
    variant: 'Alert',
    icon: 'icon-regular-circle-x',
  },
} satisfies Record<DisplayableRevShareStatus, StatusContent>;

const getStatusLabel = (
  status: DisplayableRevShareStatus,
  tPendingTranslation: ReturnType<typeof useTranslationWrapper>['tPendingTranslation'],
): string => {
  if (status === RevShareConfirmationStatus.Accepted) {
    return tPendingTranslation(
      'Accepted',
      'Pin next to a recipient who has accepted the proposed revenue split.',
      translationKey('Label.RecipientAccepted', TranslationNamespace.RevenueShareAgreements),
    );
  }
  if (status === RevShareConfirmationStatus.Pending) {
    return tPendingTranslation(
      'Pending',
      'Pin next to a recipient who has not yet responded to the proposed split.',
      translationKey('Label.RecipientPending', TranslationNamespace.RevenueShareAgreements),
    );
  }
  return tPendingTranslation(
    'Denied',
    'Pin next to a recipient who has denied the proposed revenue split.',
    translationKey('Label.RecipientDenied', TranslationNamespace.RevenueShareAgreements),
  );
};

export type RevShareStatusBadgeProps = {
  /** Backend confirmation status. Renders nothing for AutoAccepted or when omitted. */
  status?: RevShareConfirmationStatus;
};

const RevShareStatusBadge: FunctionComponent<RevShareStatusBadgeProps> = ({ status }) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());

  if (!status || status === RevShareConfirmationStatus.AutoAccepted) {
    return null;
  }

  const content = STATUS_TO_CONTENT[status];
  const label = getStatusLabel(status, tPendingTranslation);

  return <Badge variant={content.variant} icon={content.icon} label={label} />;
};

export default RevShareStatusBadge;
