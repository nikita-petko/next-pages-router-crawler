import { memo } from 'react';
import NextLink from 'next/link';
import { useTranslation, withTranslation } from '@rbx/intl';
import { useLocalStorage } from '@rbx/react-utilities';
import { Alert, AlertTitle, Button, CloseIcon, IconButton } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { docs } from '@modules/miscellaneous/urls/creatorHub';

type Props = {
  universeId: number;
  enabled?: boolean;
  type: 'gamepass' | 'developerproduct';
  onClose?: () => void;
  className?: string;
};

const hasDismissedRegionalPricingBannerKey = (universeId: number, type: string) =>
  `hasDismissedRegionalPricingBanner.${universeId}.${type}`;

const regionalPricingDocumentationLink = docs.getRegionalPricingMonetizationUrl();

const NewRegionalPricingBanner = ({
  universeId,
  enabled = true,
  type,
  onClose,
  className,
}: Props) => {
  const { translate } = useTranslation();

  const [isDismissed, setIsDismissed] = useLocalStorage<true | null>(
    hasDismissedRegionalPricingBannerKey(universeId, type),
    null,
  );

  const isVisible = enabled && !isDismissed;

  const handleClose = () => {
    setIsDismissed(true);
    onClose?.();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Alert
      severity='info'
      variant='outlined'
      className={className}
      action={[
        <Button
          key='regionalPricingBanner-learnMore'
          color='inherit'
          size='small'
          component={NextLink}
          href={regionalPricingDocumentationLink}>
          {translate('Description.LearnMore')}
        </Button>,
        <IconButton
          key='regionalPricingBanner-close'
          aria-label={translate('Action.Close')}
          color='secondary'
          onClick={handleClose}>
          <CloseIcon />
        </IconButton>,
      ]}>
      <AlertTitle className='padding-bottom-[4px]'>
        {translate('Heading.NewRegionalPricingBanner')}
      </AlertTitle>
      <span>{translate('Description.NewRegionalPricingBanner')}</span>
    </Alert>
  );
};

export default withTranslation(memo(NewRegionalPricingBanner), [
  TranslationNamespace.RegionalPricing,
]);
