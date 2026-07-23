import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { TeamSize } from '@rbx/client-talent-hub-v2-service/v2';
import { Button, FeedbackBanner } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import gamesClient from '@modules/clients/games';
import { th2QueryKeys } from '../../queryKeys';
import type { StudioViewModel } from '../../types';
import { isMocksEnabled, TH2_QUERY_OPTIONS } from '../../utils';
import { StudioFormFields, type StudioFormErrors } from './StudioFormFields';
import type { StudioFormState } from './StudioFormFields.types';
import styles from '../shared/Layout.module.css';

export type { StudioFormState } from './StudioFormFields.types';

const EXPERIENCE_SLOT_COUNT = 5;

function studioToFormState(studio: StudioViewModel): StudioFormState {
  const topIds = studio.topExperienceUniverseIds ?? [];
  const experiences: Array<number | null> = [];
  for (let slotIndex = 0; slotIndex < EXPERIENCE_SLOT_COUNT; slotIndex++) {
    experiences.push(topIds[slotIndex] ?? null);
  }

  const teamSize: TeamSize = studio.teamSize ?? 0;

  return {
    name: studio.name ?? '',
    email: studio.email ?? '',
    description: studio.description ?? '',
    teamSize,
    groupUrl: '',
    website: studio.website ?? '',
    atsLink: studio.atsLink ?? '',
    experiences,
    legalBusinessName: '',
    countryOfIncorporation: '',
    stateOfIncorporation: '',
  };
}

function isValidOptionalUrl(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length === 0 || /^https?:\/\//i.test(trimmed);
}

type StudioEditFormProps = {
  studio: StudioViewModel;
  onCancel: () => void;
  onSave: (state: StudioFormState) => void;
  isSaving?: boolean;
  saveError?: string | null;
};

export const StudioEditForm: React.FC<StudioEditFormProps> = ({
  studio,
  onCancel,
  onSave,
  isSaving = false,
  saveError = null,
}) => {
  const { translate } = useTranslation();
  const [form, setForm] = useState<StudioFormState>(() => studioToFormState(studio));
  const [hasSubmitted, setHasSubmitted] = useState(false);

  function translateWithFallback(key: string, fallback: string): string {
    const value = translate(key);
    return value && value !== key ? value : fallback;
  }

  const existingTopUniverseIds = (studio.topExperienceUniverseIds ?? []).filter(
    (universeId): universeId is number => typeof universeId === 'number',
  );
  const mocks = isMocksEnabled();
  const { data: gamesResponse } = useQuery({
    queryKey: th2QueryKeys.gameDetails.list(existingTopUniverseIds),
    queryFn: () => gamesClient.getDetails(existingTopUniverseIds),
    enabled: !mocks && existingTopUniverseIds.length > 0,
    ...TH2_QUERY_OPTIONS,
  });

  const experienceNamesById: Record<number, string> = {};
  if (mocks && existingTopUniverseIds.length > 0) {
    for (const universeId of existingTopUniverseIds) {
      experienceNamesById[universeId] = `Experience ${universeId}`;
    }
  } else {
    for (const game of gamesResponse?.data ?? []) {
      if (game.id != null) {
        experienceNamesById[game.id] = game.name ?? `Experience ${String(game.id)}`;
      }
    }
  }

  const validationErrors: StudioFormErrors = {
    name: form.name.trim() ? '' : translate('Error.StudioNameRequired'),
    email: form.email.trim() ? '' : translate('Error.ContactEmailRequired'),
    description: form.description.trim() ? '' : translate('Error.DescriptionRequired'),
    teamSize:
      form.teamSize == null
        ? translateWithFallback('Error.TeamSizeRequired', 'Please select a team size.')
        : '',
    website: isValidOptionalUrl(form.website)
      ? ''
      : translateWithFallback(
          'Error.ValidWebsiteUrlRequired',
          'Enter a website URL that starts with http:// or https://.',
        ),
    atsLink: isValidOptionalUrl(form.atsLink)
      ? ''
      : translateWithFallback(
          'Error.ValidAtsLinkRequired',
          'Enter an ATS or careers link that starts with http:// or https://.',
        ),
  };

  const errors: StudioFormErrors = {
    name: hasSubmitted ? validationErrors.name : undefined,
    email: hasSubmitted ? validationErrors.email : undefined,
    description: hasSubmitted ? validationErrors.description : undefined,
    teamSize: hasSubmitted ? validationErrors.teamSize : undefined,
    website: validationErrors.website,
    atsLink: validationErrors.atsLink,
  };

  const isValid = Object.values(validationErrors).every((message) => message === '');

  const handleSave = () => {
    setHasSubmitted(true);
    if (!isValid) {
      return;
    }
    onSave(form);
  };

  return (
    <div className='gap-large flex flex-col'>
      <div className='gap-xsmall flex flex-col'>
        <div className='text-heading-large'>{translate('Heading.EditProfile')}</div>
        <div className='content-muted text-body-large'>
          {translate('Description.UpdateStudioDetails')}
        </div>
      </div>

      <div className='gap-medium flex flex-col'>
        {saveError ? (
          <FeedbackBanner
            title=''
            description={saveError}
            layout='Inline'
            variant='Standard'
            severity='Error'
          />
        ) : null}
        <StudioFormFields
          mode='edit'
          state={form}
          errors={errors}
          onChange={setForm}
          experienceNamesById={experienceNamesById}
        />
        <div className='content-muted text-body-large'>
          {translate('Description.AtsSetUpNeedsManualApproval')}
        </div>
      </div>

      <div className={styles.stickyFooter}>
        <Button
          variant='Emphasis'
          size='Medium'
          onClick={handleSave}
          isDisabled={!isValid || isSaving}
          isLoading={isSaving}>
          {translate('Action.SaveChanges')}
        </Button>
        <Button variant='Standard' size='Medium' onClick={onCancel} isDisabled={isSaving}>
          {translate('Action.Cancel')}
        </Button>
      </div>
    </div>
  );
};

export default StudioEditForm;
