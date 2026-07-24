import type { FunctionComponent } from 'react';
import { FeedbackBanner } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const GroupPayoutIssueBanner: FunctionComponent = () => {
  const { ready, tPendingTranslation } = useTranslationWrapper(useTranslation());

  if (!ready) {
    return null;
  }

  return (
    <FeedbackBanner
      severity='Warning'
      variant='Emphasis'
      layout='Stacked'
      title={tPendingTranslation(
        'We are aware of an issue affecting Group Payouts, and our team is actively looking into it to restore full functionality as quickly as possible.',
        'Warning banner explaining that the Group Payouts issue is under active investigation.',
        translationKey('Banner.GroupPayoutIssue', TranslationNamespace.Payouts),
      )}
    />
  );
};

export default withTranslation(GroupPayoutIssueBanner, [TranslationNamespace.Payouts]);
