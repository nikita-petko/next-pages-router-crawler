import React, { useMemo, useState } from 'react';
import { Button, Divider, FeedbackBanner, TextArea, TextInput } from '@rbx/foundation-ui';
import type { StudioViewModel } from '../../types';

export type StudioFormState = {
  name: string;
  email: string;
  description: string;
  website: string;
  socialLinks: string;
  atsLink: string;
};

function studioToForm(studio: StudioViewModel): StudioFormState {
  return {
    name: studio.name ?? '',
    email: studio.email ?? '',
    description: studio.description ?? '',
    website: studio.website ?? '',
    socialLinks: (studio.socialLinks ?? []).join(', '),
    atsLink: studio.atsLink ?? '',
  };
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
  const [form, setForm] = useState<StudioFormState>(() => studioToForm(studio));
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const errors = useMemo(
    () => ({
      name: form.name.trim() ? '' : 'Studio name is required.',
      email: form.email.trim() ? '' : 'Contact email is required.',
      description: form.description.trim() ? '' : 'Description is required.',
    }),
    [form],
  );

  const isValid = Object.values(errors).every((v) => v === '');

  const setField = (field: keyof StudioFormState, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = () => {
    setHasSubmitted(true);
    if (!isValid) return;
    onSave(form);
  };

  return (
    <div className='flex flex-col gap-large'>
      <div className='flex flex-col gap-xsmall'>
        <div className='text-title-large'>Edit studio profile</div>
        <div className='text-body-medium content-muted'>
          Update your studio details so applicants can learn about you.
        </div>
      </div>

      <div className='flex flex-col gap-medium'>
        {saveError ? (
          <FeedbackBanner
            title=''
            description={saveError}
            layout='Inline'
            variant='Standard'
            severity='Error'
          />
        ) : null}
        <TextInput
          label='Studio name'
          value={form.name}
          onChange={(e) => setField('name', e.target.value)}
          isRequired
          hasError={hasSubmitted && !!errors.name}
          error={hasSubmitted ? errors.name : ''}
        />
        <TextInput
          label='Contact email'
          value={form.email}
          onChange={(e) => setField('email', e.target.value)}
          isRequired
          hasError={hasSubmitted && !!errors.email}
          error={hasSubmitted ? errors.email : ''}
        />
        <TextArea
          label='Description'
          value={form.description}
          onChange={(e) => setField('description', e.target.value)}
          hasError={hasSubmitted && !!errors.description}
          rows={6}
        />
        {hasSubmitted && errors.description ? (
          <div className='text-body-small content-muted'>{errors.description}</div>
        ) : null}
        <Divider />
        <TextInput
          label='Website'
          value={form.website}
          onChange={(e) => setField('website', e.target.value)}
          helperText='https://...'
        />
        <TextInput
          label='Social links (comma separated)'
          value={form.socialLinks}
          onChange={(e) => setField('socialLinks', e.target.value)}
        />
        <TextInput
          label='ATS / careers link'
          value={form.atsLink}
          onChange={(e) => setField('atsLink', e.target.value)}
          helperText='External hiring page URL (optional).'
        />
      </div>

      <div className='flex flex-col small:flex-row gap-small'>
        <Button
          variant='Emphasis'
          size='Small'
          onClick={handleSave}
          isDisabled={!isValid || isSaving}
          isLoading={isSaving}>
          Save profile
        </Button>
        <Button variant='Standard' size='Small' onClick={onCancel} isDisabled={isSaving}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default StudioEditForm;
