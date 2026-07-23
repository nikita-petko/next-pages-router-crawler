import React, { useCallback, useId, useMemo } from 'react';
import type { TeamSize } from '@rbx/client-talent-hub-v2-service/v2';
import {
  Dropdown,
  Menu,
  MenuItem,
  Radio,
  RadioGroup,
  TextArea,
  TextInput,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { API_TEAM_SIZE_LABELS } from '../../constants';
import {
  COUNTRY_OPTIONS,
  hasSubdivisionDropdown,
  STATE_OPTIONS_BY_COUNTRY,
} from '../../constants/incorporationLocations';
import { ExperienceCombobox } from './ExperienceCombobox';
import type { StudioFormState } from './StudioFormFields.types';

const EMPTY_EXPERIENCE_NAMES: Record<number, string> = {};

const EXPERIENCE_SLOT_KEYS = ['slot-a', 'slot-b', 'slot-c', 'slot-d', 'slot-e'] as const;

const DESCRIPTION_MAX_CHARS = 500;

function isTeamSize(value: number): value is TeamSize {
  return Object.hasOwn(API_TEAM_SIZE_LABELS, value);
}

export type StudioFormErrors = Partial<Record<keyof StudioFormState, string>>;

export interface StudioFormFieldsProps {
  mode: 'create' | 'edit';
  state: StudioFormState;
  errors: StudioFormErrors;
  onChange: (next: StudioFormState) => void;
  experienceNamesById?: Record<number, string>;
}

/**
 * Studio create / edit form fields, ordered to match the Figma onboarding spec.
 *
 * Notes for future maintainers:
 *  - The "Country of incorporation" dropdown stores ISO 3166-1 alpha-2 codes.
 *  - "State / province" renders as a dropdown when we have a curated
 *    subdivision list (US, CA — see {@link STATE_OPTIONS_BY_COUNTRY}); for any
 *    other country it falls back to a free-text input.
 *  - DUNS was previously here and has been removed pending Persona-based
 *    business verification. The remaining incorporation fields validate on
 *    submit but are not yet sent to the API — see `SUBMIT_INCORPORATION_FIELDS`
 *    in `StudioFormFields.types.ts`.
 */
export function StudioFormFields({
  mode,
  state,
  errors,
  onChange,
  experienceNamesById = EMPTY_EXPERIENCE_NAMES,
}: StudioFormFieldsProps) {
  const { translate } = useTranslation();
  const tr = useCallback(
    (key: string, fallback: string) => {
      const value = translate(key);
      return value && value !== key ? value : fallback;
    },
    [translate],
  );

  const teamSizeGroupLabelId = useId();

  const setField = <K extends keyof StudioFormState>(field: K, value: StudioFormState[K]) => {
    onChange({ ...state, [field]: value });
  };

  // Switching countries invalidates a previously chosen state code (e.g. picking
  // "California" then switching country to Canada must not leave "CA" stuck in
  // form state where it would now mean Quebec's neighbour). Reset state on
  // country change unless the new country still has the same code in its
  // subdivision list.
  const setCountry = (countryCode: string) => {
    const nextStates = STATE_OPTIONS_BY_COUNTRY[countryCode];
    const previousStateStillValid =
      nextStates?.some((option) => option.code === state.stateOfIncorporation) ?? false;
    onChange({
      ...state,
      countryOfIncorporation: countryCode,
      stateOfIncorporation: previousStateStillValid ? state.stateOfIncorporation : '',
    });
  };

  const excludedForSlot = (slotIndex: number) =>
    state.experiences
      .map((id, idx) => (idx !== slotIndex && id != null ? id : null))
      .filter((id): id is number => id != null);

  const stateSubdivisions = useMemo(
    () => STATE_OPTIONS_BY_COUNTRY[state.countryOfIncorporation],
    [state.countryOfIncorporation],
  );
  const stateIsDropdown = hasSubdivisionDropdown(state.countryOfIncorporation);

  const descriptionLength = state.description.length;
  const descriptionOverLimit = descriptionLength > DESCRIPTION_MAX_CHARS;

  return (
    <div className='gap-medium flex flex-col'>
      <div data-th2-field='name'>
        <TextInput
          error={errors.name ?? ''}
          hasError={!!errors.name}
          isRequired
          label={tr('Label.StudioName', 'Studio name')}
          onChange={(e) => setField('name', e.target.value)}
          placeholder={tr(
            'Placeholder.StudioName',
            "This will be displayed on your studio's Talent Hub profile.",
          )}
          value={state.name}
        />
      </div>

      <div className='gap-xxsmall flex flex-col' data-th2-field='legalBusinessName'>
        <TextInput
          error={errors.legalBusinessName ?? ''}
          hasError={!!errors.legalBusinessName}
          isRequired
          label={tr('Label.LegalBusinessName', 'Legal business name')}
          onChange={(e) => setField('legalBusinessName', e.target.value)}
          value={state.legalBusinessName}
        />
        <div className='content-muted text-body-small'>
          {tr(
            'Description.LegalBusinessName',
            'The legal entity registered with Dun & Bradstreet. This may be different from your studio name and will not be displayed on your studio profile. Use the exact name on your incorporation documents.',
          )}
        </div>
      </div>

      <div className='gap-xxsmall flex flex-col' data-th2-field='countryOfIncorporation'>
        <span className='text-label-large'>
          {tr('Label.CountryOfIncorporation', 'Country of incorporation')}
          <span aria-hidden> *</span>
        </span>
        <Dropdown
          className='width-full'
          hasError={!!errors.countryOfIncorporation}
          onValueChange={(value) => setCountry(value)}
          placeholder={tr('Placeholder.SelectAnOption', 'Select an Option')}
          size='Large'
          value={state.countryOfIncorporation}>
          <Menu>
            {COUNTRY_OPTIONS.map((option) => (
              <MenuItem key={option.code} title={option.name} value={option.code} />
            ))}
          </Menu>
        </Dropdown>
        {errors.countryOfIncorporation ? (
          <div className='content-system-alert text-caption-small'>
            {errors.countryOfIncorporation}
          </div>
        ) : null}
      </div>

      <div className='gap-xxsmall flex flex-col' data-th2-field='stateOfIncorporation'>
        {stateIsDropdown ? (
          <>
            <span className='text-label-large'>
              {tr('Label.StateOfIncorporation', 'State / province of incorporation')}
              <span aria-hidden> *</span>
            </span>
            <Dropdown
              className='width-full'
              hasError={!!errors.stateOfIncorporation}
              onValueChange={(value) => setField('stateOfIncorporation', value)}
              placeholder={tr('Placeholder.SelectAnOption', 'Select an Option')}
              size='Large'
              value={state.stateOfIncorporation}>
              <Menu>
                {stateSubdivisions?.map((option) => (
                  <MenuItem key={option.code} title={option.name} value={option.code} />
                ))}
              </Menu>
            </Dropdown>
          </>
        ) : (
          <TextInput
            error={errors.stateOfIncorporation ?? ''}
            hasError={!!errors.stateOfIncorporation}
            isRequired
            label={tr('Label.StateOfIncorporation', 'State / province of incorporation')}
            onChange={(e) => setField('stateOfIncorporation', e.target.value)}
            placeholder={tr(
              'Placeholder.StateOfIncorporation',
              'State, province, or region of incorporation',
            )}
            value={state.stateOfIncorporation}
          />
        )}
        {stateIsDropdown && errors.stateOfIncorporation ? (
          <div className='content-system-alert text-caption-small'>
            {errors.stateOfIncorporation}
          </div>
        ) : null}
      </div>

      <div data-th2-field='website'>
        <TextInput
          error={errors.website ?? ''}
          hasError={!!errors.website}
          isRequired
          label={tr('Label.StudioWebsite', 'Studio website')}
          onChange={(e) => setField('website', e.target.value)}
          placeholder={tr(
            'Placeholder.StudioWebsite',
            "Link to your studio's website. Careers page preferred.",
          )}
          value={state.website}
        />
      </div>

      <div className='gap-xxsmall flex flex-col' data-th2-field='email'>
        <TextInput
          error={errors.email ?? ''}
          hasError={!!errors.email}
          isRequired
          label={tr('Label.WorkEmail', 'Work email')}
          onChange={(e) => setField('email', e.target.value)}
          placeholder={tr('Placeholder.WorkEmail', "We'll use this to contact you.")}
          value={state.email}
        />
        <div className='content-muted text-body-small'>
          {tr(
            'Description.WorkEmail',
            "We may send a verification link here. Please use a work email where you want to receive talent job notifications — we don't accept gmail, outlook, or other personal email providers.",
          )}
        </div>
      </div>

      <div className='gap-xxsmall flex flex-col' data-th2-field='description'>
        <span className='text-label-large'>
          {tr('Label.StudioDescription', 'Studio description')}
          <span aria-hidden> *</span>
        </span>
        <TextArea
          aria-label={tr('Label.StudioDescription', 'Studio description')}
          hasError={!!errors.description || descriptionOverLimit}
          maxLength={DESCRIPTION_MAX_CHARS}
          onChange={(e) => setField('description', e.target.value)}
          placeholder={tr(
            'Placeholder.StudioDescription',
            'Brief description of your studio and the games you create.',
          )}
          rows={4}
          value={state.description}
        />
        <div className='flex items-center justify-between'>
          <div className='content-system-alert text-caption-small'>{errors.description ?? ''}</div>
          <div className='content-muted text-body-small'>
            {`${descriptionLength}/${DESCRIPTION_MAX_CHARS} char max`}
          </div>
        </div>
      </div>

      <div className='gap-xsmall flex flex-col' data-th2-field='teamSize'>
        <span className='text-label-large' id={teamSizeGroupLabelId}>
          {tr('Label.TeamSize', 'Team size')}
          <span aria-hidden> *</span>
        </span>
        <RadioGroup
          aria-labelledby={teamSizeGroupLabelId}
          onValueChange={(value) => {
            const numeric = Number(value);
            if (isTeamSize(numeric)) {
              setField('teamSize', numeric);
            }
          }}
          value={state.teamSize == null ? '' : String(state.teamSize)}>
          {Object.entries(API_TEAM_SIZE_LABELS).map(([value, label]) => (
            <Radio key={value} label={label} value={value} />
          ))}
        </RadioGroup>
        {errors.teamSize ? (
          <div className='content-system-alert text-caption-small'>{errors.teamSize}</div>
        ) : null}
      </div>

      {mode === 'create' ? (
        <div className='gap-xxsmall flex flex-col' data-th2-field='groupUrl'>
          <TextInput
            error={errors.groupUrl ?? ''}
            hasError={!!errors.groupUrl}
            isRequired
            label={tr('Label.PrimaryRobloxGroup', 'Primary Roblox group')}
            onChange={(e) => setField('groupUrl', e.target.value)}
            placeholder={tr(
              'Placeholder.PrimaryRobloxGroup',
              'Ex: https://www.roblox.com/communities/6821794/Alpha-Strike-Group#!/about',
            )}
            value={state.groupUrl}
          />
          <div className='content-muted text-body-small'>
            {tr(
              'Description.PrimaryRobloxGroup',
              'Link the primary Roblox group for your game studio. This will be shown on your Talent profile and where you will manage your studio on Talent Hub.',
            )}
          </div>
        </div>
      ) : null}

      {mode === 'edit' ? (
        <TextInput
          error={errors.atsLink ?? ''}
          hasError={!!errors.atsLink}
          label={translate('Label.ApplicantTrackingSystemLinkOptional')}
          onChange={(e) => setField('atsLink', e.target.value)}
          placeholder='https://api.ashbyhq.com/posting-api/your_link_here'
          value={state.atsLink}
        />
      ) : null}

      <div className='gap-small flex flex-col'>
        <div className='text-heading-small'>
          {tr('Heading.TopGamesYouveWorkedOn', "Top games you've worked on")}
        </div>
        <div className='content-muted text-body-small'>
          {tr(
            'Description.TopGamesYouveWorkedOn',
            'To help us evaluate your studio, we highly encourage you to link to games that your studio has worked on. These can be either Roblox or external games.',
          )}
        </div>
        {state.experiences.map((expId, index) => (
          <div className='gap-xxsmall flex flex-col' key={EXPERIENCE_SLOT_KEYS[index]}>
            <span className='text-label-large'>
              {tr(`Label.Experience${index + 1}`, `Experience ${index + 1}`)}
            </span>
            <ExperienceCombobox
              aria-label={tr(`Label.Experience${index + 1}`, `Experience ${index + 1}`)}
              displayName={expId != null ? experienceNamesById[expId] : undefined}
              excludedIds={excludedForSlot(index)}
              onChange={(universeId) => {
                const next = [...state.experiences];
                next[index] = universeId;
                setField('experiences', next);
              }}
              placeholder={tr('Placeholder.SearchExperiences', 'Search experiences')}
              value={expId}
            />
          </div>
        ))}
        {errors.experiences ? (
          <div className='content-system-alert text-caption-small'>{errors.experiences}</div>
        ) : null}
      </div>
    </div>
  );
}
