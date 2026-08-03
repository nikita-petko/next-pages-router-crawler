import { Button } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import { getSupportFormUrl } from '@modules/miscellaneous/urls/www';
import { closeDialog, openDialog } from '@modules/monetization-shared/dialog/actions';
import ErrorDialogContent from '@modules/monetization-shared/error-dialogs/ErrorDialogContent';
import { Link } from '@modules/monetization-shared/link';

const supportLink = getSupportFormUrl();

/**
 * Generic error with support link for Dynamic Price Check (and similar flows).
 * Copy: `CreatorDashboard.PriceOptimization` (Heading.Error, Message.Error);
 * `Action.Close` in `CreatorDashboard.Controls`.
 */
function GeneralErrorDialogContent() {
  const { translate, translateHTML } = useTranslation();
  return (
    <ErrorDialogContent
      title={translate('Heading.Error' /* TranslationNamespace.PriceOptimization */)}
      body={translateHTML('Message.Error' /* TranslationNamespace.PriceOptimization */, [
        {
          opening: 'linkStart',
          closing: 'linkEnd',
          content: (chunks) => (
            <Link href={supportLink} rel='noreferrer' target='_blank' isExternal={false}>
              {chunks}
            </Link>
          ),
        },
      ])}
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

const TranslatedGeneralErrorDialogContent = withTranslation(GeneralErrorDialogContent, [
  TranslationNamespace.PriceOptimization,
  TranslationNamespace.Controls,
]);

export function openGeneralErrorDialog() {
  openDialog({
    content: <TranslatedGeneralErrorDialogContent />,
  });
}
