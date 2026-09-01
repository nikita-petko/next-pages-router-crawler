import { Alert, Button } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useExternallyIneligibleShopItems } from '../hooks/useExternallyIneligibleShopItems';
import { useHasExternallyIneligibleShopItems } from '../hooks/useHasExternallyIneligibleShopItems';

type ProcessReceiptWarningBannerProps = {
  universeId: number;
};

function ProcessReceiptWarningBanner({ universeId }: ProcessReceiptWarningBannerProps) {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { items, isLoading } = useExternallyIneligibleShopItems(universeId);
  const hasExternallyIneligibleShopItems = useHasExternallyIneligibleShopItems();

  if (isLoading || items.length === 0 || !hasExternallyIneligibleShopItems) {
    return null;
  }

  const namespace = TranslationNamespace.DeveloperProducts;
  const heading = tPendingTranslation(
    'Developer products hidden outside your game',
    'Warning banner heading for developer products that cannot be granted outside the experience.',
    translationKey('Heading.ExternalEligibilityWarning', namespace),
  );
  const description = tPendingTranslation(
    "Some developer products are hidden outside your game, like Home and Game Details Page, because they can't grant correctly. Fix and republish your scripts in Studio to make them available to players.",
    'Warning banner description explaining why externally ineligible developer products are hidden.',
    translationKey('Description.ExternalEligibilityWarning', namespace),
  );
  const viewReportLabel = tPendingTranslation(
    'View report',
    'Action label for opening the ProcessReceipt external eligibility report.',
    translationKey('Action.ViewExternalEligibilityReport', namespace),
  );

  return (
    <Alert variant='Feedback' severity='Warning' hasCloseAffordance={false}>
      <div className='flex items-start gap-x-large gap-y-medium large:gap-y-none width-full wrap large:no-wrap'>
        <div className='flex flex-col gap-xsmall grow-1 min-width-0'>
          <strong>{heading}</strong>
          <span>{description}</span>
        </div>
        <Button className='shrink-0' variant='Standard' size='Medium'>
          {viewReportLabel}
        </Button>
      </div>
    </Alert>
  );
}

export default withTranslation(ProcessReceiptWarningBanner, [
  TranslationNamespace.PersonalizedShop,
]);
