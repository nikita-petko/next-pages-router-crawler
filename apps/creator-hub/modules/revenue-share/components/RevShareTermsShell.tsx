// Provides shared payout terms body, consent checkbox, and controlled back and submit actions for revenue-share consent steps.
import { useCallback, useId, type FunctionComponent, type ReactNode } from 'react';
import { Button, Checkbox, type TCheckboxCheckState } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { RevShareTermsActionProps } from './revShareTermsActionProps';

type RevShareTermsShellProps = RevShareTermsActionProps & {
  chrome?: ReactNode;
  description: string;
  termsHeading?: string;
  consentLabel: string;
  backLabel: string;
  submitLabel: string;
  submitVariant?: 'Emphasis' | 'Alert';
};

const RevShareTermsShell: FunctionComponent<RevShareTermsShellProps> = ({
  chrome,
  description,
  termsHeading,
  consentLabel,
  backLabel,
  submitLabel,
  submitVariant = 'Emphasis',
  isAccepted,
  onAcceptedChange,
  onBack,
  onSubmit,
  isDisabled = false,
  isSubmitting = false,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const payoutTerms = [
    tPendingTranslation(
      'Payments are made daily based on when each transaction was created — you may keep receiving payouts for a short time after leaving.',
      'Revenue-share term explaining the daily payment schedule and delayed payouts after leaving an agreement.',
      translationKey('Label.TermsDailyPayments', TranslationNamespace.RevenueShareAgreements),
    ),
    tPendingTranslation(
      'If there is a rounding difference, the maximum is paid out and the remainder carries to the next cycle.',
      'Revenue-share term explaining how rounding differences carry into the next payment cycle.',
      translationKey('Label.TermsRounding', TranslationNamespace.RevenueShareAgreements),
    ),
    tPendingTranslation(
      'If you do not have a Creator Wallet, you are paid in Robux or prompted to set one up. Tax is handled per creator.',
      'Revenue-share term explaining Creator Wallet, Robux, and creator tax handling.',
      translationKey('Label.TermsPaymentMethod', TranslationNamespace.RevenueShareAgreements),
    ),
    tPendingTranslation(
      'Anyone in this agreement cannot be removed from the group while it is active.',
      'Revenue-share term explaining the group-membership restriction while an agreement is active.',
      translationKey('Label.TermsGroupMembership', TranslationNamespace.RevenueShareAgreements),
    ),
  ];
  const payoutTermsHeadingId = useId();
  const controlsDisabled = isDisabled || isSubmitting;
  const handleAcceptedChange = useCallback(
    (checked: TCheckboxCheckState) => {
      if (checked !== 'indeterminate') {
        onAcceptedChange(checked);
      }
    },
    [onAcceptedChange],
  );
  const handleSubmit = useCallback(() => {
    if (isAccepted && !controlsDisabled) {
      onSubmit();
    }
  }, [controlsDisabled, isAccepted, onSubmit]);

  return (
    <div className='flex flex-col gap-large width-full margin-x-auto'>
      {chrome}
      <div className='flex flex-col gap-xsmall'>
        <p className='text-body-medium content-muted margin-none'>{description}</p>
      </div>
      <section
        className='flex flex-col gap-small bg-surface-200 radius-medium padding-large'
        aria-labelledby={payoutTermsHeadingId}>
        <h3 id={payoutTermsHeadingId} className='text-body-large content-emphasis margin-none'>
          {termsHeading ??
            tPendingTranslation(
              'How payouts work',
              'Heading for the revenue-share payout terms list.',
              translationKey('Heading.HowPayoutsWork', TranslationNamespace.RevenueShareAgreements),
            )}
        </h3>
        <ul className='flex flex-col gap-small padding-left-large margin-none'>
          {payoutTerms.map((term) => (
            <li key={term} className='text-body-medium content-muted [list-style-type:disc]'>
              {term}
            </li>
          ))}
        </ul>
      </section>
      <Checkbox
        size='Medium'
        placement='Start'
        label={consentLabel}
        isChecked={isAccepted}
        isDisabled={controlsDisabled}
        onCheckedChange={handleAcceptedChange}
      />
      <div className='flex justify-end gap-medium'>
        <Button
          type='button'
          variant='Standard'
          size='Medium'
          isDisabled={controlsDisabled}
          onClick={onBack}>
          {backLabel}
        </Button>
        <Button
          type='button'
          variant={submitVariant}
          size='Medium'
          isDisabled={!isAccepted || controlsDisabled}
          isLoading={isSubmitting}
          onClick={handleSubmit}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
};

export default RevShareTermsShell;
