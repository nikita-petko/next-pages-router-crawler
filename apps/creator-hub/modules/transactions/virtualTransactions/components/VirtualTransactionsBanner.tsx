import type { FunctionComponent } from 'react';
import React, { useState } from 'react';
import { FeedbackBanner, Link } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { www } from '@modules/miscellaneous/urls';

// Points creators who are looking for their own (non-creator) purchase history to
// the personal transactions page on the main site.
const VirtualTransactionsBanner: FunctionComponent<React.PropsWithChildren> = () => {
  const { translate, translateHTML } = useTranslationWrapper(useTranslation());
  const [dismissed, setDismissed] = useState<boolean>(false);

  if (dismissed) {
    return null;
  }

  return (
    <FeedbackBanner
      data-testid='virtual-transactions-banner-id'
      className='bg-none !stroke-system-emphasis'
      severity='Info'
      showIcon
      onDismiss={() => setDismissed(true)}
      title={translate(
        translationKey('Label.PersonalPurchasesPrompt', TranslationNamespace.Transactions),
      )}
      description={translateHTML(
        translationKey('Action.ViewPersonalTransactions', TranslationNamespace.Transactions),
        [
          {
            opening: 'linkStart',
            closing: 'linkEnd',
            content(chunks: React.ReactNode) {
              return (
                <Link
                  href={www.getTransactionsUrl()}
                  target='_blank'
                  rel='noopener noreferrer'
                  isExternal={false}
                  color='Standard'
                  underline='none'>
                  {chunks}
                </Link>
              );
            },
          },
        ],
      )}
    />
  );
};

export default VirtualTransactionsBanner;
