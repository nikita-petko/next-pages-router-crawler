import { useState, memo } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Alert, AlertTitle, CloseIcon, IconButton } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { usePriceValidationConfig } from '../hooks/usePriceValidationConfig';
import { isActiveStatus } from '../utils/priceValidationStatusUtils';

interface PriceCheckProductCreationWarningProps {
  className?: string;
}

/**
 * Alert to notify users that product pricing may not display as expected
 * for newly created products while dynamic price check is enabled.
 * Checks and visibility are internally handled by the component.
 */
const PriceCheckProductCreationWarning = ({ className }: PriceCheckProductCreationWarningProps) => {
  const { translate } = useTranslation();
  const universeId = useCurrentGame().gameDetails?.id;

  const [isAlertOpen, setIsAlertOpen] = useState<boolean>(true);

  const { config } = usePriceValidationConfig(universeId);

  const isAlertVisible = isAlertOpen && isActiveStatus(config?.status);

  if (!isAlertVisible) {
    return null;
  }

  return (
    <Alert
      className={className}
      severity='warning'
      action={
        <IconButton
          aria-label={translate('Action.Close')}
          color='secondary'
          onClick={() => setIsAlertOpen(false)}>
          <CloseIcon aria-hidden />
        </IconButton>
      }>
      <AlertTitle>{translate('Heading.PriceCheckActiveWarning')}</AlertTitle>
      {translate('Description.PriceCheckActiveCreateWarning')}
    </Alert>
  );
};

export default withTranslation(memo(PriceCheckProductCreationWarning), [
  TranslationNamespace.PriceOptimization,
]);
