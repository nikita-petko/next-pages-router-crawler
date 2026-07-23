import { useCallback, useMemo, type FunctionComponent } from 'react';
import { Chip, Dropdown, Menu, MenuItem } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import type { CorePlace } from '../../hooks/useUniversePlacesForCores';
import { MAX_PLACE_IDS, buildPlaceIdToNameMap, dedupePlaceIds } from '../../utils/coresValidation';

const EXPERIENCE_KEY = '__EXPERIENCE_ALL__';

export type PlacesMultiSelectProps = {
  availablePlaces: CorePlace[];
  value: number[];
  isWholeExperience?: boolean;
  isDisabled?: boolean;
  onChange: (placeIds: number[], isWholeExperience: boolean) => void;
  placeholder?: string;
};

const PlacesMultiSelect: FunctionComponent<PlacesMultiSelectProps> = ({
  availablePlaces,
  value,
  isWholeExperience = false,
  isDisabled,
  onChange,
  placeholder,
}) => {
  const { translate } = useTranslationWrapper(useTranslation());

  const selectedSet = useMemo(() => new Set(value), [value]);
  const placeIdToName = useMemo(() => buildPlaceIdToNameMap(availablePlaces), [availablePlaces]);

  const experienceLabel = translate(
    translationKey('Label.ExperienceWhole', TranslationNamespace.CloudServices),
  ) as string;
  const triggerPlaceholder =
    placeholder ??
    (translate(translationKey('Label.SelectPlaces', TranslationNamespace.CloudServices)) as string);

  const handleValueChange = useCallback(
    (next: string) => {
      if (next === EXPERIENCE_KEY) {
        onChange([], true);
        return;
      }
      const placeId = Number(next);
      if (!Number.isFinite(placeId)) {
        return;
      }
      if (selectedSet.has(placeId)) {
        return;
      }
      const merged = dedupePlaceIds([...value, placeId]).slice(0, MAX_PLACE_IDS);
      onChange(merged, false);
    },
    [onChange, selectedSet, value],
  );

  const removeChip = useCallback(
    (placeId: number) => {
      onChange(
        value.filter((id) => id !== placeId),
        false,
      );
    },
    [onChange, value],
  );

  return (
    <div className='flex flex-col gap-medium width-full min-width-0'>
      <Dropdown
        className='width-full'
        size='Medium'
        value={undefined}
        placeholder={triggerPlaceholder}
        isDisabled={isDisabled}
        onValueChange={handleValueChange}
        ariaLabel={
          translate(translationKey('Label.Places', TranslationNamespace.CloudServices)) as string
        }>
        <Menu>
          <MenuItem
            key={EXPERIENCE_KEY}
            value={EXPERIENCE_KEY}
            title={experienceLabel}
            disabled={availablePlaces.length === 0 || isWholeExperience}
          />
          {availablePlaces.map((place) => (
            <MenuItem
              key={place.placeId}
              value={String(place.placeId)}
              title={place.name}
              disabled={selectedSet.has(place.placeId) || isWholeExperience}
            />
          ))}
        </Menu>
      </Dropdown>

      {(isWholeExperience || value.length > 0) && (
        <div
          className='flex flex-row gap-small width-full min-width-0 max-width-full'
          data-testid='places-multi-select-chips'>
          {isWholeExperience ? (
            <Chip
              text={experienceLabel}
              size='Small'
              variant='Standard'
              isChecked={false}
              trailingIconName='icon-filled-x'
              style={{ borderRadius: 4 }}
              onCheckedChange={() => {
                if (!isDisabled) {
                  onChange([], false);
                }
              }}
            />
          ) : (
            value.map((id) => {
              const name = placeIdToName.get(id) ?? String(id);
              return (
                <Chip
                  key={id}
                  text={name}
                  size='Small'
                  variant='Standard'
                  isChecked={false}
                  trailingIconName='icon-filled-x'
                  style={{ borderRadius: 4 }}
                  onCheckedChange={() => {
                    if (!isDisabled) {
                      removeChip(id);
                    }
                  }}
                />
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default PlacesMultiSelect;
