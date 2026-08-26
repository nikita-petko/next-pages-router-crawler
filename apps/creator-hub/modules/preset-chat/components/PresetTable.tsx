import type { FunctionComponent } from 'react';
import { useCallback, useRef } from 'react';
import { PointerActivationConstraints } from '@dnd-kit/dom';
import { move } from '@dnd-kit/helpers';
import type { DragEndEvent } from '@dnd-kit/react';
import { DragDropProvider, KeyboardSensor, PointerSensor } from '@dnd-kit/react';
import {
  Button,
  Icon,
  Link,
  Table,
  TableBody,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Tooltip,
  TooltipTrigger,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { Preset, PresetStatus } from '../types';
import PresetRow from './PresetRow';

const DRAG_ACTIVATION_DISTANCE_PX = 5;
const PRESET_LIST_SENSORS = [
  PointerSensor.configure({
    activationConstraints: [
      new PointerActivationConstraints.Distance({ value: DRAG_ACTIVATION_DISTANCE_PX }),
    ],
  }),
  KeyboardSensor,
];

type PresetTableProps = {
  presets: Preset[];
  minPresetsPerCategory: number;
  maxPresetsPerCategory: number;
  onAddPreset: () => void;
  onDeletePreset: (presetId: string) => void;
  onUpdatePresetText: (presetId: string, text: string) => void;
  onReorderPresets: (presetIds: string[]) => void;
  onDeleteCategory: () => void;
  canAddPreset: boolean;
  isDisabled?: boolean;
  overrideStatus?: PresetStatus;
};

const PresetTable: FunctionComponent<PresetTableProps> = ({
  presets,
  minPresetsPerCategory,
  maxPresetsPerCategory,
  onAddPreset,
  onDeletePreset,
  onUpdatePresetText,
  onReorderPresets,
  onDeleteCategory,
  canAddPreset,
  isDisabled,
  overrideStatus,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const containerRef = useRef<HTMLTableSectionElement>(null);
  const getContainerElement = useCallback(() => containerRef.current, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { source } = event.operation;
      if (event.canceled || !source) {
        return;
      }
      const presetIds = presets.map((p) => p.id);
      const nextPresetIds = move(presetIds, event);
      if (nextPresetIds !== presetIds) {
        onReorderPresets(nextPresetIds);
      }
    },
    [presets, onReorderPresets],
  );

  const canDelete = presets.length > minPresetsPerCategory;

  return (
    <div className='flex flex-col gap-medium'>
      <div className='stroke-standard stroke-default radius-medium clip [&>div]:bg-none'>
        <DragDropProvider sensors={PRESET_LIST_SENSORS} onDragEnd={handleDragEnd}>
          <Table size='Medium' variant='Divided'>
            <TableHeader>
              <TableRow>
                <TableHeaderCell className='[width:200px] [&>div]:!content-emphasis [&>div]:!text-caption-large height-1200'>
                  {tPendingTranslation(
                    'Quick Words',
                    'The current working title for Preset Chat.',
                    translationKey('Label.QuickWords', TranslationNamespace.PresetChat),
                  )}
                </TableHeaderCell>
                <TableHeaderCell className='[&>div]:!content-emphasis [&>div]:!text-caption-large height-1200'>
                  <span className='flex items-center gap-xsmall'>
                    {tPendingTranslation(
                      'Status',
                      'Column header for preset approval status',
                      translationKey('Label.Status', TranslationNamespace.PresetChat),
                    )}
                    <Tooltip
                      position='top-center'
                      title={
                        <span>
                          {tPendingTranslation(
                            'Quick Words status is based on Roblox policy.',
                            'Tooltip explaining that status is policy-based',
                            translationKey('Tooltip.StatusInfo', TranslationNamespace.PresetChat),
                          )}{' '}
                          <Link
                            className='content-link'
                            variant='Inline'
                            href='https://create.roblox.com/docs/chat/preset-system-guidelines'
                            target='_blank'
                            isExternal={false}>
                            {tPendingTranslation(
                              'Learn more',
                              'A link to the Preset system guidelines.',
                              translationKey('Action.LearnMore', TranslationNamespace.PresetChat),
                            )}
                          </Link>
                        </span>
                      }
                      ariaLabel={tPendingTranslation(
                        'Quick Words status is based on Roblox policy.',
                        'Tooltip explaining that status is policy-based',
                        translationKey('Tooltip.StatusInfo', TranslationNamespace.PresetChat),
                      )}>
                      <TooltipTrigger asChild>
                        <span className='flex items-center content-muted'>
                          <Icon size='Small' name='icon-regular-circle-i' />
                        </span>
                      </TooltipTrigger>
                    </Tooltip>
                  </span>
                </TableHeaderCell>
                <TableHeaderCell>{null}</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody ref={containerRef}>
              {presets.map((preset, index) => (
                <PresetRow
                  key={preset.id}
                  preset={preset}
                  index={index}
                  canDelete={canDelete}
                  isDisabled={isDisabled}
                  overrideStatus={overrideStatus}
                  getContainerElement={getContainerElement}
                  onTextChange={onUpdatePresetText}
                  onDelete={onDeletePreset}
                />
              ))}
            </TableBody>
          </Table>
        </DragDropProvider>
      </div>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-medium'>
          <Button
            variant='Standard'
            size='Small'
            isDisabled={!canAddPreset || isDisabled}
            onClick={onAddPreset}>
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
          isDisabled={isDisabled}
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
