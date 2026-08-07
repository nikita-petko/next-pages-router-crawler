import { Alert } from '@rbx/foundation-ui';
import { useTranslationWithNamespace } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export function ArchivedGamePassReadOnlyBanner({ className }: { className?: string }) {
  const { translate } = useTranslationWithNamespace(TranslationNamespace.Passes);

  return (
    <Alert className={className} variant='Feedback' severity='Info' hasCloseAffordance={false}>
      {translate('Message.ArchivedPassReadOnly')}
    </Alert>
  );
}
