import { useEffect, useRef, type FunctionComponent } from 'react';
import { Button, Icon } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

// Provides back navigation from an agreement detail view to the agreement list.
type RevShareBackNavProps = {
  label?: string;
  onBack: () => void;
  focusOnMount?: boolean;
};

const RevShareBackNav: FunctionComponent<RevShareBackNavProps> = ({
  label,
  onBack,
  focusOnMount = false,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const buttonRef = useRef<HTMLButtonElement>(null);
  const accessibleLabel =
    label ??
    tPendingTranslation(
      'Revenue Share',
      'Back navigation label from a revenue share agreement detail view to the agreement list.',
      translationKey('Label.BackToRevenueShare', TranslationNamespace.RevenueShareAgreements),
    );

  useEffect(() => {
    if (focusOnMount) {
      buttonRef.current?.focus();
    }
  }, [focusOnMount]);

  return (
    <nav aria-label={accessibleLabel}>
      <Button ref={buttonRef} variant='Utility' size='Small' type='button' onClick={onBack}>
        <span className='flex items-center gap-xxsmall content-system-emphasis'>
          <Icon name='icon-regular-chevron-small-left' size='Small' aria-hidden />
          <span>{accessibleLabel}</span>
        </span>
      </Button>
    </nav>
  );
};

export default RevShareBackNav;
