import {
  Button,
  Checkbox,
  SheetActions,
  SheetBody,
  SheetContent,
  SheetRoot,
  SheetTitle,
} from '@rbx/foundation-ui';
import { type FC, useEffect, useId, useState } from 'react';

import GameUniverseDropdown from '@components/common/creative/GameUniverseDropdown';
import {
  EXPERIENCE_FILTER_ALL,
  MEDIA_TYPE_FILTER,
  SOURCE_FILTER,
  STATUS_FILTER,
} from '@constants/creativeLibrary';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { type AdvertisedUniverse } from '@type/universe';

export type StatusCheckboxValue =
  | typeof STATUS_FILTER.APPROVED
  | typeof STATUS_FILTER.PENDING_REVIEW
  | typeof STATUS_FILTER.REJECTED
  | typeof STATUS_FILTER.ARCHIVED;

export type MediaTypeCheckboxValue =
  | typeof MEDIA_TYPE_FILTER.IMAGE
  | typeof MEDIA_TYPE_FILTER.VIDEO
  | typeof MEDIA_TYPE_FILTER.MODEL;

// SourceCheckboxValue strings ARE the wire-level `AdCreativeAssetSource`
// values, so `asset.source` can be compared directly without mapping.
export type SourceCheckboxValue = typeof SOURCE_FILTER.GEN_AI | typeof SOURCE_FILTER.UPLOAD;

interface CreativeLibraryFilterDrawerProps {
  advertisableUniverses: ReadonlyArray<AdvertisedUniverse>;
  experience: string;
  mediaTypes: ReadonlySet<MediaTypeCheckboxValue>;
  onApply: (filters: {
    experience: string;
    mediaTypes: Set<MediaTypeCheckboxValue>;
    sources: Set<SourceCheckboxValue>;
    statuses: Set<StatusCheckboxValue>;
  }) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  sources: ReadonlySet<SourceCheckboxValue>;
  statuses: ReadonlySet<StatusCheckboxValue>;
}

const toggleSetValue = <T,>(set: ReadonlySet<T>, value: T): Set<T> => {
  const next = new Set(set);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return next;
};

const setsEqual = <T,>(a: ReadonlySet<T>, b: ReadonlySet<T>): boolean => {
  if (a.size !== b.size) {
    return false;
  }
  return [...a].every((value) => b.has(value));
};

// Foundation `Checkbox`'s built-in label is bold (`text-title-medium`); we
// want body weight so the section heading reads as primary. Render the
// label ourselves and put the Checkbox in `aria-label`-only mode.
interface FilterCheckboxRowProps {
  isChecked: boolean;
  label: string;
  onCheckedChange: () => void;
}

const FilterCheckboxRow: FC<FilterCheckboxRowProps> = ({ isChecked, label, onCheckedChange }) => {
  const id = useId();
  return (
    <div className='flex items-start gap-medium'>
      <Checkbox
        aria-label={label}
        id={id}
        isChecked={isChecked}
        onCheckedChange={onCheckedChange}
        placement='Start'
        size='Medium'
      />
      <label
        className='text-body-medium content-emphasis cursor-pointer padding-top-xxsmall'
        htmlFor={id}>
        {label}
      </label>
    </div>
  );
};

// Apply-on-commit drawer: keeps a draft per dimension, seeded from the
// parent on open. Apply pushes the draft up; Close discards; Reset all
// clears the draft to empty without committing.
const CreativeLibraryFilterDrawer: FC<CreativeLibraryFilterDrawerProps> = ({
  advertisableUniverses,
  experience,
  mediaTypes,
  onApply,
  onOpenChange,
  open,
  sources,
  statuses,
}) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.CreativeLibrary);

  const [draftExperience, setDraftExperience] = useState<string>(experience);
  const [draftMediaTypes, setDraftMediaTypes] = useState<Set<MediaTypeCheckboxValue>>(
    () => new Set(mediaTypes),
  );
  const [draftSources, setDraftSources] = useState<Set<SourceCheckboxValue>>(
    () => new Set(sources),
  );
  const [draftStatuses, setDraftStatuses] = useState<Set<StatusCheckboxValue>>(
    () => new Set(statuses),
  );

  useEffect(() => {
    if (open) {
      setDraftExperience(experience);
      setDraftMediaTypes(new Set(mediaTypes));
      setDraftSources(new Set(sources));
      setDraftStatuses(new Set(statuses));
    }
  }, [experience, mediaTypes, open, sources, statuses]);

  const hasAnyDraftFilter =
    draftExperience !== EXPERIENCE_FILTER_ALL ||
    draftMediaTypes.size > 0 ||
    draftSources.size > 0 ||
    draftStatuses.size > 0;

  const isDirty =
    draftExperience !== experience ||
    !setsEqual(draftMediaTypes, mediaTypes) ||
    !setsEqual(draftSources, sources) ||
    !setsEqual(draftStatuses, statuses);

  const handleResetAll = () => {
    setDraftExperience(EXPERIENCE_FILTER_ALL);
    setDraftMediaTypes(new Set());
    setDraftSources(new Set());
    setDraftStatuses(new Set());
  };

  const handleApply = () => {
    onApply({
      experience: draftExperience,
      mediaTypes: draftMediaTypes,
      sources: draftSources,
      statuses: draftStatuses,
    });
    onOpenChange(false);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const renderSectionLabel = (label: string) => (
    <p className='text-label-medium content-emphasis'>{label}</p>
  );

  const renderMediaTypeGroup = () => {
    const options: Array<{ labelKey: string; value: MediaTypeCheckboxValue }> = [
      { labelKey: 'Label.Image', value: MEDIA_TYPE_FILTER.IMAGE },
      { labelKey: 'Label.Video', value: MEDIA_TYPE_FILTER.VIDEO },
      { labelKey: 'Label.Model', value: MEDIA_TYPE_FILTER.MODEL },
    ];
    return (
      <div className='flex flex-col gap-small'>
        {renderSectionLabel(translate('Label.MediaType'))}
        <div className='flex flex-col gap-medium'>
          {options.map((option) => (
            <FilterCheckboxRow
              isChecked={draftMediaTypes.has(option.value)}
              key={option.value}
              label={translate(option.labelKey)}
              onCheckedChange={() =>
                setDraftMediaTypes((current) => toggleSetValue(current, option.value))
              }
            />
          ))}
        </div>
      </div>
    );
  };

  const renderSourceGroup = () => {
    const options: Array<{ labelKey: string; value: SourceCheckboxValue }> = [
      { labelKey: 'Label.Uploaded', value: SOURCE_FILTER.UPLOAD },
      { labelKey: 'Label.AiGenerated', value: SOURCE_FILTER.GEN_AI },
    ];
    return (
      <div className='flex flex-col gap-small'>
        {renderSectionLabel(translate('Label.Source'))}
        <div className='flex flex-col gap-medium'>
          {options.map((option) => (
            <FilterCheckboxRow
              isChecked={draftSources.has(option.value)}
              key={option.value}
              label={translate(option.labelKey)}
              onCheckedChange={() =>
                setDraftSources((current) => toggleSetValue(current, option.value))
              }
            />
          ))}
        </div>
      </div>
    );
  };

  const renderStatusGroup = () => {
    const options: Array<{ labelKey: string; value: StatusCheckboxValue }> = [
      { labelKey: 'Label.Approved', value: STATUS_FILTER.APPROVED },
      { labelKey: 'Label.InReview', value: STATUS_FILTER.PENDING_REVIEW },
      { labelKey: 'Label.Rejected', value: STATUS_FILTER.REJECTED },
      { labelKey: 'Label.Archived', value: STATUS_FILTER.ARCHIVED },
    ];
    return (
      <div className='flex flex-col gap-small'>
        {renderSectionLabel(translate('Label.Status'))}
        <div className='flex flex-col gap-medium'>
          {options.map((option) => (
            <FilterCheckboxRow
              isChecked={draftStatuses.has(option.value)}
              key={option.value}
              label={translate(option.labelKey)}
              onCheckedChange={() =>
                setDraftStatuses((current) => toggleSetValue(current, option.value))
              }
            />
          ))}
        </div>
      </div>
    );
  };

  const renderGameDropdown = () => {
    if (advertisableUniverses.length === 0) {
      return null;
    }
    return (
      <div className='flex flex-col gap-small'>
        <GameUniverseDropdown
          advertisableUniverses={advertisableUniverses}
          label={translate('Label.Game')}
          onValueChange={setDraftExperience}
          placeholder={translate('Label.SelectAGame')}
          staticOptions={[{ label: translate('Label.AllGames'), value: EXPERIENCE_FILTER_ALL }]}
          value={draftExperience}
        />
      </div>
    );
  };

  return (
    <SheetRoot onOpenChange={onOpenChange} open={open}>
      <SheetContent
        closeLabel={translate('Action.Close')}
        largeScreenClassName='!max-width-[440px] width-full'
        largeScreenVariant='side'>
        <SheetTitle>{translate('Heading.FilterByCategory')}</SheetTitle>
        <SheetBody>
          <div className='flex flex-col gap-xxlarge'>
            <div className='flex'>
              <Button
                isDisabled={!hasAnyDraftFilter}
                onClick={handleResetAll}
                size='Medium'
                variant='Standard'>
                {translate('Action.ResetAll')}
              </Button>
            </div>
            {renderGameDropdown()}
            {renderMediaTypeGroup()}
            {renderStatusGroup()}
            {renderSourceGroup()}
          </div>
        </SheetBody>
        {/* Per Figma: Apply + Close split the drawer footer 50/50 instead
            of sitting auto-sized on the left. The buttons are direct
            children of the SheetActions flex container, so giving each
            `grow-1 width-full` makes them flex-share the available row
            width. */}
        <SheetActions className='flex flex-row items-center gap-small'>
          <Button
            className='grow-1 width-full'
            isDisabled={!isDirty}
            onClick={handleApply}
            size='Medium'
            variant='Emphasis'>
            {translate('Action.Apply')}
          </Button>
          <Button
            className='grow-1 width-full'
            onClick={handleClose}
            size='Medium'
            variant='Standard'>
            {translate('Action.Close')}
          </Button>
        </SheetActions>
      </SheetContent>
    </SheetRoot>
  );
};

export default CreativeLibraryFilterDrawer;
