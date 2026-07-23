import React, { FunctionComponent } from 'react';
import { Button } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { useTranslationWrapper, translationKey } from '@modules/analytics-translations';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import { components } from '@modules/miscellaneous/common';

const UnlockEmptyState: FunctionComponent = () => {
  const { EmptyState } = components;
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
        color='primaryBrand'
        variant='contained'
        onClick={() => window.open('/settings/eligibility/extended-services')}>
        {translate(translationKey('Label.CheckEligibility', TranslationNamespace.CloudServices))}
      </Button>
    </EmptyState>
  );
};

export default withTranslation(UnlockEmptyState, [TranslationNamespace.CloudServices]);
