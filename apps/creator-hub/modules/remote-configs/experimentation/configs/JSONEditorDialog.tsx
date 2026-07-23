import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { CodeEditor, CodeEditorSupportedLanguages } from '@modules/charts-generic';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Button, DialogActions, DialogContent, DialogTitle } from '@rbx/ui';
import React, { Fragment, useCallback, useState } from 'react';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import prettyPrintJson from '../../utils/prettyPrintJson';

type JSONEditorDialogProps = {
  initialValue: string;
  onCancel: () => void;
  onSave: (value: string) => void;
};

const JSONEditorDialog = ({ initialValue, onCancel, onSave }: JSONEditorDialogProps) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const [stringValue, setStringValue] = useState(initialValue);
  const handleBlur = useCallback((value: string | undefined) => {
    const formattedJson = prettyPrintJson(value);
    if (formattedJson) {
      setStringValue(formattedJson);
    } else {
      setStringValue(value ?? '');
    }
  }, []);

  const handleSave = useCallback(() => {
    onSave(stringValue);
  }, [onSave, stringValue]);

  return (
    <Fragment>
      <DialogTitle>
        {translate(
          translationKey(
            'Dialog.EditJSONValue.Title',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        )}
      </DialogTitle>
      <DialogContent dividers>
        <CodeEditor
          value={stringValue}
          onBlur={handleBlur}
          formatOnBlur
          language={CodeEditorSupportedLanguages.Json}
          height='30vh'
          placeholder={translate(
            translationKey(
              'Dialog.CreateOrEdit.Placeholder.Json.Value',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
            {
              jsonString:
                prettyPrintJson(
                  JSON.stringify({
                    boss_health: 100,
                    menu_color: 'red',
                    menu_items: ['item1', 'item2', 'item3'],
                  }),
                ) ?? '',
            },
          )}
        />
      </DialogContent>
      <DialogActions>
        <Button
          data-testid='cancel-button'
          variant='outlined'
          aria-label='cancel'
          color='secondary'
          onClick={onCancel}>
          {translate(translationKey('Action.Cancel', TranslationNamespace.Controls))}
        </Button>
        <Button
          data-testid='save-button'
          variant='contained'
          color='primaryBrand'
          onClick={handleSave}>
          {translate(translationKey('Action.Save', TranslationNamespace.Controls))}
        </Button>
      </DialogActions>
    </Fragment>
  );
};

export default withTranslation(JSONEditorDialog, [
  TranslationNamespace.Controls,
  TranslationNamespace.UniverseConfigAndExperimentation,
]);
