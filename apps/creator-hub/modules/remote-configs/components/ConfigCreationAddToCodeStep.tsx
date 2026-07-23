import { FC, useCallback, useMemo, useState } from 'react';
import { Button, Snackbar } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { HighlightingCodeBlock, HighlightingCodeBlockLanguage } from '@modules/charts-generic';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import generateSnippet from '../utils/generateSnippet';

type ConfigCreationAddToCodeStepProps = {
  configKey: string;
  onDone: () => void;
};

const ConfigCreationAddToCodeStep: FC<ConfigCreationAddToCodeStepProps> = ({
  configKey,
  onDone,
}) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const [isClipboardCopySuccessSnackbarVisible, setIsClipboardCopySuccessSnackbarVisible] =
    useState(false);

  const closeClipboardCopySuccessSnackbar = useCallback(() => {
    setIsClipboardCopySuccessSnackbarVisible(false);
  }, []);

  const snippetText = useMemo(() => {
    if (!configKey) {
      return '';
    }
    return generateSnippet(configKey);
  }, [configKey]);

  const onCopyClicked = useCallback(() => {
    if (!snippetText) {
      return;
    }
    navigator.clipboard.writeText(snippetText);
    setIsClipboardCopySuccessSnackbarVisible(true);
  }, [snippetText]);

  const clipboardCopySuccessToastLabel = translate(
    translationKey(
      'Toast.ClipboardCopySuccess',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );

  return (
    <div className='margin-top-large'>
      {isClipboardCopySuccessSnackbarVisible ? (
        <Snackbar
          title={clipboardCopySuccessToastLabel}
          shouldAutoDismiss
          onClose={closeClipboardCopySuccessSnackbar}
        />
      ) : null}
      <div className='margin-bottom-small text-body-medium content-muted'>
        {translate(
          translationKey(
            'Dialog.Snippet.Subheader',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        )}
      </div>

      <div className='stroke-standard stroke-default padding-medium radius-medium'>
        <HighlightingCodeBlock
          code={snippetText}
          codePreviewSnippet={snippetText}
          language={HighlightingCodeBlockLanguage.Lua}
          expanded
        />
      </div>

      <div className='margin-top-medium'>
        <Button type='button' variant='Standard' isDisabled={!snippetText} onClick={onCopyClicked}>
          {translate(
            translationKey('Action.Copy', TranslationNamespace.UniverseConfigAndExperimentation),
          )}
        </Button>
      </div>

      <div className='margin-top-large'>
        <Button type='button' variant='Emphasis' onClick={onDone}>
          {translate(
            translationKey(
              'Dialog.Snippet.Confirm',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          )}
        </Button>
      </div>
    </div>
  );
};

export default ConfigCreationAddToCodeStep;
