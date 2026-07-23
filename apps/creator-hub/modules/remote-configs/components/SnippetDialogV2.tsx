import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import { Button, Dialog, DialogContent } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import HighlightingCodeBlock, {
  HighlightingCodeBlockLanguage,
} from '@modules/charts-generic/components/HighlightingCodeBlock/HighlightingCodeBlock';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import generateSnippet from '../utils/generateSnippet';

type SnippetDialogV2Props = {
  configKey: string | null;
  onClose: () => void;
  onCopySnippet: (key: string) => void;
};

// v2 of SnippetDialog component using foundation ui
const SnippetDialogV2: FC<SnippetDialogV2Props> = ({ configKey, onClose, onCopySnippet }) => {
  const { translate } = useTranslationWrapper(useTranslation());

  const snippetText = useMemo(() => {
    if (!configKey) {
      return null;
    }
    return generateSnippet(configKey, true);
  }, [configKey]);

  const onCopyClicked = useCallback(() => {
    if (!configKey) {
      return;
    }
    onCopySnippet(configKey);
  }, [configKey, onCopySnippet]);

  const titleText = translate(
    translationKey('Dialog.Snippet.Title', TranslationNamespace.UniverseConfigAndExperimentation),
  );
  const subheaderText = translate(
    translationKey(
      'Dialog.Snippet.Subheader',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const confirmText = translate(
    translationKey('Dialog.Snippet.Confirm', TranslationNamespace.UniverseConfigAndExperimentation),
  );
  const closeLabel = translate(translationKey('Action.Close', TranslationNamespace.Controls));
  const copyLabel = translate(
    translationKey('Action.Copy', TranslationNamespace.UniverseConfigAndExperimentation),
  );

  return (
    <Dialog
      open={configKey !== null}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
      size='Large'
      isModal
      hasCloseAffordance
      closeLabel={closeLabel}>
      <DialogContent>
        <div className='flex flex-col padding-medium gap-small'>
          <div className='padding-right-large'>
            <div className='text-heading-small content-emphasis padding-bottom-xxsmall'>
              {titleText}
            </div>
            <div className='text-body-medium content-default'>{subheaderText}</div>
          </div>
          {snippetText && (
            <div className='stroke-standard stroke-default padding-medium radius-medium'>
              <HighlightingCodeBlock
                code={snippetText}
                codePreviewSnippet={snippetText}
                language={HighlightingCodeBlockLanguage.Lua}
                expanded
                secondaryActionButton={
                  <Button variant='Standard' onClick={onCopyClicked}>
                    {copyLabel}
                  </Button>
                }
              />
            </div>
          )}
          <div className='flex gap-xsmall'>
            <Button variant='Emphasis' onClick={onClose}>
              {confirmText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SnippetDialogV2;
