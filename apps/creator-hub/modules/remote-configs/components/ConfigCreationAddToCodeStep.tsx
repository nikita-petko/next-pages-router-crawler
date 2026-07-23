import type { FC } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, Snackbar } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import HighlightingCodeBlock, {
  HighlightingCodeBlockLanguage,
} from '@modules/charts-generic/components/HighlightingCodeBlock/HighlightingCodeBlock';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import generateSnippet from '../utils/generateSnippet';

type ConfigCreationAddToCodeStepProps = {
  configKey: string;
  onDone: () => void;
  // When provided, the Done navigation button is portaled into this container
  // so the parent can render it in a page-level sticky footer. Copy button
  // remains inline since it acts on the code snippet shown above it.
  actionBarContainer?: HTMLElement | null;
};

const ConfigCreationAddToCodeStep: FC<ConfigCreationAddToCodeStepProps> = ({
  configKey,
  onDone,
  actionBarContainer,
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
    return generateSnippet(configKey, true);
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

  const doneButton = (
    <Button type='button' variant='Emphasis' onClick={onDone}>
      {translate(
        translationKey(
          'Dialog.Snippet.Confirm',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      )}
    </Button>
  );

  const inlineDoneButton = actionBarContainer ? null : doneButton;
  const portaledDoneButton = actionBarContainer
    ? createPortal(doneButton, actionBarContainer)
    : null;

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

      <div className='margin-top-large flex gap-small'>
        <Button type='button' variant='Standard' isDisabled={!snippetText} onClick={onCopyClicked}>
          {translate(
            translationKey('Action.Copy', TranslationNamespace.UniverseConfigAndExperimentation),
          )}
        </Button>
        {inlineDoneButton}
      </div>

      {portaledDoneButton}
    </div>
  );
};

export default ConfigCreationAddToCodeStep;
