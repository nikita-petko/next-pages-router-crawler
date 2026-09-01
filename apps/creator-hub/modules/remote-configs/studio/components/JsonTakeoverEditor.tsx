import { useCallback, useEffect, useState } from 'react';
import { Button, Tooltip, TooltipTrigger } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import CodeEditor from '@modules/charts-generic/components/CodeEditors/CodeEditor';
import CodeEditorSupportedLanguages from '@modules/charts-generic/components/CodeEditors/CodeEditorSupportedLanguages';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ValidConfigEntryValueType } from '../../api/universeConfigsClientEnums';
import useConfigJsonValidator from '../../hooks/useConfigJsonValidator';
import prettyPrintJson from '../../utils/prettyPrintJson';
import strictly from '../foundation-utils/strictly';
import type { JsonConfigEntry } from '../types/JsonConfigEntryValue';
import { foundationClasses } from './useStudioConfigStyles';

const codeEditorZIndex = { zIndex: 1 };
const tooltipAboveCodeEditorZIndex = { zIndex: 2 };

type JsonTakeoverEditorProps = {
  entry: JsonConfigEntry;
  onSave: (value: JsonConfigEntry) => void;
  onClose: () => void;
  isOpen: boolean;
};

const JsonTakeoverEditor = ({
  entry: givenEntry,
  onSave,
  onClose,
  isOpen,
}: JsonTakeoverEditorProps) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const { headerText, header } = foundationClasses;

  const initialValue = prettyPrintJson(givenEntry?.entryValue.jsonValue);
  const [stringValue, setCurrentStringValue] = useState(initialValue ?? '');
  const { key: entryKey } = givenEntry || {};

  useEffect(() => {
    setCurrentStringValue(initialValue ?? '');
  }, [initialValue]);

  const validateConfigJsonValue = useConfigJsonValidator();

  const validationResult = validateConfigJsonValue({ value: stringValue });
  const { isValid } = validationResult;
  const errorMessage = isValid ? undefined : validationResult.message;

  const handleBlur = useCallback(
    (value: string | undefined) => {
      setCurrentStringValue(prettyPrintJson(value) || '');
    },
    [setCurrentStringValue],
  );

  const handleChange = useCallback(
    (value: string | undefined) => {
      setCurrentStringValue(value || '');
    },
    [setCurrentStringValue],
  );

  const handleSave = useCallback(() => {
    if (!givenEntry) {
      return;
    }
    if (!isValid) {
      return;
    }

    if (stringValue !== initialValue) {
      const result: JsonConfigEntry = {
        ...givenEntry,
        entryValue: { valueType: ValidConfigEntryValueType.Json, jsonValue: stringValue },
      };
      onSave(result);
    }

    onClose();
  }, [givenEntry, isValid, stringValue, initialValue, onSave, onClose]);

  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (!isOpen) {
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    },
    [onClose, isOpen],
  );
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
    return;
  }, [isOpen, handleEscape]);

  if (!isOpen) {
    return null;
  }

  const keyBreadcrumb = entryKey && (
    <span className={strictly(headerText, 'padding-xxsmall', 'text-no-wrap')}>
      <span
        className={strictly(
          'select-all',
          'text-truncate-end',
          'text-no-wrap',
          'content-system-contrast',
        )}>{`${entryKey}`}</span>
    </span>
  );
  const left = <div className={strictly('flex', 'gap-xsmall')}>{keyBreadcrumb}</div>;
  const right = (
    <div className={strictly('flex', 'gap-xsmall')}>
      <Tooltip title={errorMessage ?? ''} position='bottom-end' open={!!errorMessage}>
        <TooltipTrigger asChild>
          <Button onClick={handleSave} size='XSmall' variant='Emphasis' isDisabled={!isValid}>
            {translate(
              translationKey(
                'Dialog.CreateOrEdit.Button.Save',
                TranslationNamespace.UniverseConfigAndExperimentation,
              ),
            )}
          </Button>
        </TooltipTrigger>
      </Tooltip>
      <Button onClick={onClose} size='XSmall' variant='Standard' tabIndex={0}>
        {translate(
          translationKey(
            'Dialog.CreateOrEdit.Button.Cancel',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        )}
      </Button>
    </div>
  );

  return (
    <div className={strictly('flex', 'flex-col', 'height-full')}>
      <div className={header} style={tooltipAboveCodeEditorZIndex}>
        {left}
        {right}
      </div>
      <div className={strictly('fill', 'relative')} style={codeEditorZIndex}>
        <CodeEditor
          value={stringValue}
          onChange={handleChange}
          onBlur={handleBlur}
          height='100%'
          formatOnBlur
          language={CodeEditorSupportedLanguages.Json}
        />
      </div>
    </div>
  );
};

export default JsonTakeoverEditor;
