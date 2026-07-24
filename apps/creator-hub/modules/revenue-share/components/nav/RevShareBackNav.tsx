import { useEffect, useRef, type FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

// Provides back navigation from an agreement detail view to the agreement list.
type RevShareBackNavProps = {
  label?: string;
  currentPageLabel?: string;
  onBack: () => void;
  focusOnMount?: boolean;
};

const RevShareBackNav: FunctionComponent<RevShareBackNavProps> = ({
  label,
  currentPageLabel,
  onBack,
  focusOnMount = false,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const buttonRef = useRef<HTMLButtonElement>(null);
  const parentLabel =
    label ??
    tPendingTranslation(
      'Revenue Share',
      'Back navigation label from a revenue share agreement detail view to the agreement list.',
      translationKey('Label.RevenueShare', TranslationNamespace.RevenueShareAgreements),
    );
  const navAriaLabel = currentPageLabel ?? parentLabel;

  useEffect(() => {
    if (focusOnMount) {
      buttonRef.current?.focus();
    }
  }, [focusOnMount]);

  return (
    <nav aria-label={navAriaLabel} className='flex items-center gap-small'>
      <button
        ref={buttonRef}
        type='button'
        onClick={onBack}
        className='text-body-medium content-default no-underline cursor-pointer padding-none [background:none] [border:none]'>
        {parentLabel}
      </button>
      {currentPageLabel && (
        <>
          <span className='text-body-medium content-default' aria-hidden='true'>
            /
          </span>
          <span className='text-title-medium content-emphasis'>{currentPageLabel}</span>
        </>
      )}
    </nav>
  );
};

export default RevShareBackNav;
