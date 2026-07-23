import { memo } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Alert, AlertTitle } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

type Props = {
  enabled: boolean;
  className?: string;
};

function DisallowPriceChangeInExperimentBanner({ enabled, className }: Props) {
  const { translate } = useTranslation();

  if (!enabled) {
    return null;
  }

  return (
    <Alert severity='warning' className={className}>
      <AlertTitle>{translate('Heading.DisallowPriceChangeInExperimentBanner')}</AlertTitle>
      {translate('Message.DisallowPriceChangeInExperimentBanner')}
    </Alert>
  );
}

export default withTranslation(memo(DisallowPriceChangeInExperimentBanner), [
  TranslationNamespace.ConfigureItem,
]);
