import { Button, TextArea } from '@rbx/foundation-ui';
import { type ReactElement, useState } from 'react';

import { openDialog } from '@components/common/dialog/actions';
import BaseDialog from '@components/common/dialog/BaseDialog';
import type { BaseInjectedDialogProps } from '@components/common/dialog/types';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

const MAX_FEEDBACK_LENGTH = 250;

interface CreativeLibraryFeedbackDialogProps extends BaseInjectedDialogProps {
  onSubmit: (feedback: string) => void;
}

const CreativeLibraryFeedbackDialog = ({
  onClose,
  onSubmit,
}: CreativeLibraryFeedbackDialogProps): ReactElement => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.CreativeLibrary);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const { translate: translateReport } = useNamespacedTranslation(TranslationNamespace.Report);
  const [feedback, setFeedback] = useState<string>('');

  const handleSubmit = () => {
    const sanitized = feedback.replace(/<[^>]*>/g, '').trim();
    if (!sanitized) {
      return;
    }
    onSubmit(sanitized);
    onClose();
  };

  return (
    <BaseDialog
      dialogBody={
        <div className='flex flex-col gap-xsmall'>
          <TextArea
            helperText={translate('Description.FeedbackPrivacyNotice')}
            label={translate('Label.Comments')}
            onChange={(e) => setFeedback(e.target.value.slice(0, MAX_FEEDBACK_LENGTH))}
            placeholder={translateReport('Label.FeedbackPlaceholder')}
            rows={4}
            value={feedback}
          />
          <div className='text-caption-small content-muted self-end'>
            {feedback.length}/{MAX_FEEDBACK_LENGTH}
          </div>
        </div>
      }
      dialogDescription={translate('Description.CreativeLibraryFeedback')}
      dialogFooter={
        <>
          <Button
            isDisabled={!feedback.trim()}
            onClick={handleSubmit}
            size='Medium'
            variant='Emphasis'>
            {translate('Action.Send')}
          </Button>
          <Button onClick={onClose} size='Medium' variant='Standard'>
            {translateMisc('Action.Cancel')}
          </Button>
        </>
      }
      dialogTitle={translate('Heading.CreativeLibraryFeedback')}
    />
  );
};

export const openCreativeLibraryFeedbackDialog = (onSubmit: (feedback: string) => void): void => {
  openDialog({
    component: CreativeLibraryFeedbackDialog,
    options: { hasCloseAffordance: true },
    props: { onSubmit },
  });
};
