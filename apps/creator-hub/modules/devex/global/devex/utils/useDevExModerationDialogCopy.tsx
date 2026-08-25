import type { ReactNode } from 'react';
import { Link } from '@rbx/foundation-ui';
import { useTranslation, useLocalization } from '@rbx/intl';
import type { GetDevExInfoResponse } from '@modules/clients/economy';
import { ROBLOX_COMMUNITY_STANDARDS } from '@modules/miscellaneous/common/constants/linkConstants';
import { DEVEX_APPEAL_URL, getDevexTermsURL } from '../../constants/externalLinkConstants';
import { getDevExSuspensionEndTimeUtc } from './devexEligibility';
import {
  formatSuspensionLiftDateFormattedLabel,
  formatSuspensionLiftDateRelativeLabel,
} from './formatSuspensionLiftDateLabels';

const appealLinkConfig = [
  {
    opening: 'appealLinkStart',
    closing: 'appealLinkEnd',
    content(chunks: ReactNode) {
      return (
        <Link href={DEVEX_APPEAL_URL} target='_blank' rel='noopener noreferrer' isExternal={false}>
          {chunks}
        </Link>
      );
    },
  },
];

export function useDevExAtRiskDialogCopy(): { title: string; body: ReactNode } {
  const { translate, translateHTML } = useTranslation();
  const { locale } = useLocalization();

  const title = translate('Heading.DevExAtRiskTitle');
  const body = translateHTML('Message.DevExAtRiskBody', [
    {
      opening: 'devexTermsLinkStart',
      closing: 'devexTermsLinkEnd',
      content(chunks) {
        return (
          <Link
            href={getDevexTermsURL(locale)}
            target='_blank'
            rel='noopener noreferrer'
            isExternal={false}>
            {chunks}
          </Link>
        );
      },
    },
    {
      opening: 'communityStandardsLinkStart',
      closing: 'communityStandardsLinkEnd',
      content(chunks) {
        return (
          <Link
            href={ROBLOX_COMMUNITY_STANDARDS}
            target='_blank'
            rel='noopener noreferrer'
            isExternal={false}>
            {chunks}
          </Link>
        );
      },
    },
  ]);

  return { title, body };
}

export function useDevExSuspensionDialogCopy(
  cashoutInfo: GetDevExInfoResponse,
  interventionEndDate?: string | null,
): {
  title: string;
  body: ReactNode;
  hasLiftDate: boolean;
} {
  const { translate, translateHTML } = useTranslation();

  const liftDate =
    getDevExSuspensionEndTimeUtc(cashoutInfo) ??
    (interventionEndDate ? new Date(interventionEndDate) : undefined);
  const hasLiftDate = liftDate !== undefined && !Number.isNaN(liftDate.getTime());

  const title = translate('Heading.DevExSuspendedTitle');

  if (!hasLiftDate) {
    return {
      title,
      body: translateHTML('Message.DevExSuspendedBodyPermanent', [...appealLinkConfig]),
      hasLiftDate: false,
    };
  }

  const liftDateRelative = formatSuspensionLiftDateRelativeLabel(liftDate, translate);
  const liftDateFormatted = formatSuspensionLiftDateFormattedLabel(liftDate);

  return {
    title,
    body: translateHTML('Message.DevExSuspendedBody', [...appealLinkConfig], {
      liftDateRelative,
      liftDateFormatted,
    }),
    hasLiftDate: true,
  };
}
