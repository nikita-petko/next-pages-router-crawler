import NextLink from 'next/link';
import { Alert, Button } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import { useExternallyIneligibleShopItems } from '../hooks/useExternallyIneligibleShopItems';
import { useHasExternallyIneligibleShopItems } from '../hooks/useHasExternallyIneligibleShopItems';

type ExternalEligibilityWarningBannerProps = {
  universeId: number;
};

function ExternalEligibilityWarningBanner({ universeId }: ExternalEligibilityWarningBannerProps) {
  const { translate } = useTranslation();
  const { items, isLoading } = useExternallyIneligibleShopItems(universeId);
  const hasExternallyIneligibleShopItems = useHasExternallyIneligibleShopItems();

  if (isLoading || items.length === 0 || !hasExternallyIneligibleShopItems) {
    return null;
  }

  const heading = translate('Heading.ExternalEligibilityWarning');
  const description = translate('Description.ExternalEligibilityWarning');
  const viewReportLabel = translate('Action.ViewExternalEligibilityReport');

  return (
    <Alert variant='Feedback' severity='Warning' hasCloseAffordance={false}>
      <div className='flex items-start gap-x-large gap-y-medium large:gap-y-none width-full wrap large:no-wrap'>
        <div className='flex flex-col gap-xsmall grow-1 min-width-0'>
          <strong>{heading}</strong>
          <span>{description}</span>
        </div>
        <Button asChild className='shrink-0' variant='Standard' size='Medium'>
          <NextLink href={dashboard.getExternallyHiddenDeveloperProductsUrl(universeId)}>
            {viewReportLabel}
          </NextLink>
        </Button>
      </div>
    </Alert>
  );
}

export default withTranslation(ExternalEligibilityWarningBanner, [
  TranslationNamespace.PersonalizedShop,
]);
