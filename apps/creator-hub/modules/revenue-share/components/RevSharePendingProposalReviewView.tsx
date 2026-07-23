// Presents a pending server proposal review with back navigation and a cancel-proposal action.
import type { FunctionComponent } from 'react';
import { Button } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import RevShareReviewShell from './RevShareReviewShell';
import type { RevShareDiffRowData } from './tables/RevShareDiffTable';

type RevSharePendingProposalReviewViewProps = {
  rows: readonly RevShareDiffRowData[];
  onBack: () => void;
  onCancelProposal: () => void;
};

const RevSharePendingProposalReviewView: FunctionComponent<
  RevSharePendingProposalReviewViewProps
> = ({ rows, onBack, onCancelProposal }) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());

  return (
    <RevShareReviewShell
      heading={tPendingTranslation(
        'Pending proposal',
        'Heading for reviewing a pending revenue share proposal.',
        translationKey('Heading.PendingProposal', TranslationNamespace.RevenueShareAgreements),
      )}
      description={tPendingTranslation(
        'This proposal is awaiting recipient responses. You can cancel it to withdraw the changes.',
        'Description for reviewing a pending revenue share proposal.',
        translationKey(
          'Label.PendingProposalDescription',
          TranslationNamespace.RevenueShareAgreements,
        ),
      )}
      rows={rows}
      footer={
        <div className='flex justify-end gap-medium'>
          <Button type='button' variant='Standard' size='Medium' onClick={onBack}>
            {tPendingTranslation(
              'Back',
              'Label on a button that returns to the previous step in a multi-step wizard.',
              translationKey('Action.Back', TranslationNamespace.Controls),
            )}
          </Button>
          <Button type='button' variant='Alert' size='Medium' onClick={onCancelProposal}>
            {tPendingTranslation(
              'Cancel proposal',
              'Button label for cancelling a pending revenue share proposal.',
              translationKey('Action.CancelProposal', TranslationNamespace.RevenueShareAgreements),
            )}
          </Button>
        </div>
      }
    />
  );
};

export default RevSharePendingProposalReviewView;
