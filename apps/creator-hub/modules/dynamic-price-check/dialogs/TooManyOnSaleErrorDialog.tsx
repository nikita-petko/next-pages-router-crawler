import { Button } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import { getSupportFormUrl } from '@modules/miscellaneous/urls/www';
import { closeDialog, openDialog } from '@modules/monetization-shared/dialog/actions';
import ErrorDialogContent from '@modules/monetization-shared/error-dialogs/ErrorDialogContent';
import { Link } from '@modules/monetization-shared/link';

const supportLink = getSupportFormUrl();

/**
 * Shown when price validation cannot proceed because the experience has too many on-sale products.
 * Strings: `CreatorDashboard.DynamicPriceCheck` (Heading.UnableToCompleteRequestError,
 * Message.TooManyOnSaleProductsError); `Action.Close` in `CreatorDashboard.Controls`.
 */
function TooManyOnSaleErrorDialogContent() {
  const { translate, translateHTML } = useTranslation();
  return (
    <ErrorDialogContent
      title={translate(
        'Heading.UnableToCompleteRequestError' /* TranslationNamespace.DynamicPriceCheck */,
      )}
      body={translateHTML(
        'Message.TooManyOnSaleProductsError' /* TranslationNamespace.DynamicPriceCheck */,
        [
          {
            opening: 'linkStart',
            closing: 'linkEnd',
            content: (chunks) => (
              <Link href={supportLink} rel='noreferrer' target='_blank' isExternal={false}>
                {chunks}
              </Link>
            ),
          },
        ],
      )}
      action={
        <Button
          variant='Emphasis'
          size='Medium'
          className='fill small:grow-0'
          onClick={closeDialog}>
          {translate('Action.Close' /* TranslationNamespace.Controls */)}
        </Button>
      }
      onClose={closeDialog}
    />
  );
}

const TranslatedTooManyOnSaleErrorDialogContent = withTranslation(TooManyOnSaleErrorDialogContent, [
  TranslationNamespace.DynamicPriceCheck,
  TranslationNamespace.Controls,
]);

export function openTooManyOnSaleErrorDialog() {
  openDialog({
    content: <TranslatedTooManyOnSaleErrorDialogContent />,
  });
}
