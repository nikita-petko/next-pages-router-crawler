import type { FunctionComponent } from 'react';
import { Button } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { EmptyState } from '@modules/miscellaneous/components';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';

const UnlockEmptyState: FunctionComponent = () => {
  const { translate } = useTranslationWrapper(useTranslation());
  return (
    <EmptyState
      size='large'
      illustration='noPermissions'
      title={translate(
        translationKey('Heading.NotEligibleUnlock', TranslationNamespace.CloudServices),
      )}
      description={translate(
        translationKey('Description.NotEligibleUnlock', TranslationNamespace.CloudServices),
      )}>
      <Button
        variant='Emphasis'
        size='Medium'
        onClick={() => window.open('/settings/eligibility/extended-services')}>
        {translate(translationKey('Label.CheckEligibility', TranslationNamespace.CloudServices))}
      </Button>
    </EmptyState>
  );
};

export default withTranslation(UnlockEmptyState, [TranslationNamespace.CloudServices]);
