import type { FunctionComponent, ReactNode } from 'react';
import {
  Button,
  Table,
  TableBody,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';

type PresetTableProps = {
  onAddPreset: () => void;
  onDeleteCategory: () => void;
  canAddPreset: boolean;
  children?: ReactNode;
};

const DEFAULT_MIN_PRESETS = 3;
const DEFAULT_MAX_PRESETS = 10;

const PresetTable: FunctionComponent<PresetTableProps> = ({
  onAddPreset,
  onDeleteCategory,
  canAddPreset,
  children,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { settings } = useSettings();
  const minPresetsPerCategory =
    settings.presetChatMinPresetsPerCategory > 0
      ? settings.presetChatMinPresetsPerCategory
      : DEFAULT_MIN_PRESETS;
  const maxPresetsPerCategory =
    settings.presetChatMaxPresetsPerCategory > 0
      ? settings.presetChatMaxPresetsPerCategory
      : DEFAULT_MAX_PRESETS;

  return (
    <div className='flex flex-col gap-medium'>
      <div className='stroke-standard stroke-default radius-medium clip [&>div]:bg-none'>
        <Table size='Medium' variant='Divided'>
          <TableHeader>
            <TableRow>
              <TableHeaderCell className='[width:240px] ![border-bottom:none] [&>div]:!content-emphasis [&>div]:!text-caption-large height-1200'>
                {tPendingTranslation(
                  'Quick Words',
                  'The current working title for Preset Chat.',
                  translationKey('Label.QuickWords', TranslationNamespace.PresetChat),
                )}
              </TableHeaderCell>
              <TableHeaderCell className='![border-bottom:none] [&>div]:!content-emphasis [&>div]:!text-caption-large height-1200'>
                {tPendingTranslation(
                  'Status',
                  'Column header for preset approval status',
                  translationKey('Label.Status', TranslationNamespace.PresetChat),
                )}
              </TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>{children}</TableBody>
        </Table>
      </div>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-medium'>
          <Button variant='Standard' size='Small' isDisabled={!canAddPreset} onClick={onAddPreset}>
            {tPendingTranslation(
              'Add',
              'Button to add a new preset to the category',
              translationKey('Action.AddPreset', TranslationNamespace.PresetChat),
            )}
          </Button>
          <span className='text-body-small content-emphasis'>
            {tPendingTranslation(
              '{min}-{max} Quick Words required per category',
              'Helper text showing the min and max presets allowed per category; {min} is the minimum and {max} is the maximum number of presets',
              translationKey('Label.PresetCountRequirement', TranslationNamespace.PresetChat),
              { min: String(minPresetsPerCategory), max: String(maxPresetsPerCategory) },
            )}
          </span>
        </div>
        <Button
          className='!padding-x-medium'
          variant='Standard'
          size='Small'
          onClick={onDeleteCategory}>
          {tPendingTranslation(
            'Delete category',
            'Button to remove a category',
            translationKey('Action.DeleteCategory', TranslationNamespace.PresetChat),
          )}
        </Button>
      </div>
    </div>
  );
};

export default PresetTable;
