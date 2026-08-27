import type { ChangeEvent, FocusEvent, FunctionComponent } from 'react';
import { useCallback, useMemo } from 'react';
import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers';
import { closestCenter } from '@dnd-kit/collision';
import { RestrictToElement } from '@dnd-kit/dom/modifiers';
import { useSortable } from '@dnd-kit/react/sortable';
import { IconButton, TableCell, TableRow, TextInput } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  MaxPresetLength,
  MinPresetLength,
  VALID_PRESET_TEXT_REGEX,
} from '../constants/presetChatConstants';
import type { Preset, PresetStatus } from '../types';
import QuickWordsStatusBadge from './QuickWordsStatusBadge';

type PresetRowProps = {
  preset: Preset;
  index: number;
  canDelete: boolean;
  isDisabled?: boolean;
  overrideStatus?: PresetStatus;
  getContainerElement: () => HTMLElement | null;
  onTextChange: (id: string, text: string) => void;
  onDelete: (id: string) => void;
};

const PresetRow: FunctionComponent<PresetRowProps> = ({
  preset,
  index,
  canDelete,
  isDisabled,
  overrideStatus,
  getContainerElement,
  onTextChange,
  onDelete,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());

  const modifiers = useMemo(
    () => [RestrictToVerticalAxis, RestrictToElement.configure({ element: getContainerElement })],
    [getContainerElement],
  );

  const { handleRef, isDragging, ref } = useSortable({
    id: preset.id,
    index,
    disabled: isDisabled,
    collisionDetector: closestCenter,
    modifiers,
  });

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onTextChange(preset.id, event.target.value);
    },
    [onTextChange, preset.id],
  );

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      const trimmed = event.target.value.trim();
      if (trimmed !== event.target.value) {
        onTextChange(preset.id, trimmed);
      }
    },
    [onTextChange, preset.id],
  );

  const handleDelete = useCallback(() => {
    onDelete(preset.id);
  }, [onDelete, preset.id]);

  const trimmedText = preset.text.trim();
  const hasInvalidInput =
    trimmedText.length > 0 &&
    (trimmedText.length < MinPresetLength || !VALID_PRESET_TEXT_REGEX.test(trimmedText));

  return (
    <TableRow ref={ref} className={isDragging ? 'opacity-[0.5]' : ''}>
      <TableCell className='[width:200px]'>
        <TextInput
          variant='Contrast'
          size='XSmall'
          placeholder={tPendingTranslation(
            'Placeholder',
            'Placeholder text for the preset text input',
            translationKey('Label.PresetPlaceholder', TranslationNamespace.PresetChat),
          )}
          aria-label={tPendingTranslation(
            'Preset text input',
            'Accessible label for a preset text input row',
            translationKey('Label.PresetTextInput', TranslationNamespace.PresetChat),
          )}
          isDisabled={isDisabled}
          maxLength={MaxPresetLength}
          value={preset.text}
          onChange={handleChange}
          onBlur={handleBlur}
          hasError={hasInvalidInput}
          error={
            hasInvalidInput
              ? tPendingTranslation(
                  '{min}-{max} characters, letters only',
                  'Error message when preset text is invalid; {min} is the minimum and {max} is the maximum character count',
                  translationKey('Label.InputRequirements', TranslationNamespace.PresetChat),
                  { min: String(MinPresetLength), max: String(MaxPresetLength) },
                )
              : undefined
          }
        />
      </TableCell>
      <TableCell>
        <QuickWordsStatusBadge status={preset.state} overrideStatus={overrideStatus} />
      </TableCell>
      <TableCell className='[text-align:right]'>
        <div className='flex items-center justify-end gap-small'>
          {canDelete ? (
            <IconButton
              variant='Utility'
              size='Medium'
              icon='icon-regular-trash-can'
              isDisabled={isDisabled}
              ariaLabel={tPendingTranslation(
                'Delete preset',
                'Accessible label for the delete preset button',
                translationKey('Action.DeletePreset', TranslationNamespace.PresetChat),
              )}
              onClick={handleDelete}
            />
          ) : null}
          <div ref={handleRef} className='[touch-action:none] [cursor:grab]'>
            <IconButton
              variant='Utility'
              size='Medium'
              icon='icon-regular-three-bars-horizontal-triangles-vertical'
              isDisabled={isDisabled}
              ariaLabel={tPendingTranslation(
                'Reorder preset',
                'Accessible label for the drag handle to reorder presets',
                translationKey('Action.ReorderPreset', TranslationNamespace.PresetChat),
              )}
            />
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default PresetRow;
