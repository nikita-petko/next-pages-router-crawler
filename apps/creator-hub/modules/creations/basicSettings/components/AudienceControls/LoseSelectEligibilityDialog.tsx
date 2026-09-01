import type { FunctionComponent } from 'react';
import { Button, Dialog, DialogContent, DialogTitle } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';

export type LoseSelectEligibilityDialogProps = {
  open: boolean;
  onContinue: () => void;
  onCancel: () => void;
};

const LoseSelectEligibilityDialog: FunctionComponent<LoseSelectEligibilityDialogProps> = ({
  open,
  onContinue,
  onCancel,
}) => {
  const { translate } = useTranslationWrapper(useTranslation());

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onCancel();
        }
      }}
      size='Small'
      isModal
      hasCloseAffordance
      closeLabel={translate(translationKey('Action.Close', TranslationNamespace.Controls))}>
      <DialogContent>
        <div className='flex flex-col padding-large gap-large'>
          <DialogTitle className='text-heading-small margin-none'>
            {translate(
              translationKey('Heading.LoseSelectEligibility', TranslationNamespace.ConfigureItem),
            )}
          </DialogTitle>
          <p className='text-body-medium margin-none content-default'>
            {translate(
              translationKey(
                'Description.LoseSelectEligibility',
                TranslationNamespace.ConfigureItem,
              ),
            )}
          </p>
          <div className='flex gap-small'>
            <Button
              variant='Emphasis'
              size='Medium'
              className='grow-1 basis-0'
              onClick={onContinue}>
              {translate(translationKey('Action.Continue', TranslationNamespace.ConfigureItem))}
            </Button>
            <Button variant='Standard' size='Medium' className='grow-1 basis-0' onClick={onCancel}>
              {translate(translationKey('Action.Cancel', TranslationNamespace.Controls))}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoseSelectEligibilityDialog;
