import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useState } from 'react';
import {
  Button,
  Dropdown,
  FeedbackBanner,
  Menu,
  MenuItem,
  Radio,
  RadioGroup,
  TextArea,
  TextInput,
} from '@rbx/foundation-ui';
import { Thumbnail2d, ThumbnailTypes, ReturnPolicy } from '@rbx/thumbnails';
import { useAuthentication } from '@modules/authentication/providers';
import { useExperienceDetails } from '../../hooks/useExperienceDetails';
import type {
  ApiTalentProfile,
  ApiTalentProfileCreateRequest,
  ApiTalentProfileUpdateRequest,
} from '../../types';
import {
  JOB_FUNCTION_OPTIONS,
  formStateToPayload,
  initialStateFrom,
  isRelocationChoice,
  type FormState,
} from './profileFormState';
import styles from '../shared/Layout.module.css';

type ProfileFormProps = {
  mode: 'create' | 'edit';
  initialProfile?: ApiTalentProfile;
  isSaving: boolean;
  onSubmit: (payload: ApiTalentProfileCreateRequest | ApiTalentProfileUpdateRequest) => void;
  onCancel?: () => void;
  submitLabel?: string;
  submitError?: string | null;
  /**
   * When true, the form hides its own submit/cancel action row. The parent is
   * expected to wire a pinned footer via `ref` + `useImperativeHandle`. Used
   * by the in-dialog apply flow where we want the actions pinned outside the
   * scroll region so they're never hidden on tall forms.
   */
  hideActions?: boolean;
  onValidityChange?: (state: { isValid: boolean; hasSubmitted: boolean }) => void;
};

export type ProfileFormHandle = {
  submit: () => void;
};

const ProfileFormImpl = forwardRef<ProfileFormHandle, ProfileFormProps>(function ProfileFormImpl(
  {
    mode,
    initialProfile,
    isSaving,
    onSubmit,
    onCancel,
    submitLabel,
    submitError = null,
    hideActions = false,
    onValidityChange,
  },
  ref,
) {
  const { user } = useAuthentication();
  const robloxUsername = user?.name ?? '';

  const [formState, setFormState] = useState<FormState>(() => initialStateFrom(initialProfile));
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [draggingExperienceId, setDraggingExperienceId] = useState<number | null>(null);
  const experienceUniverseIds = useMemo(
    () => formState.workExperiences.map((item) => item.universeId),
    [formState.workExperiences],
  );
  const { details: experienceDetails } = useExperienceDetails(experienceUniverseIds);
  const experienceNameByUniverseId = useMemo(
    () => new Map(experienceDetails.map((detail) => [detail.universeId, detail.name])),
    [experienceDetails],
  );

  const setField = useCallback(<K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  }, []);

  const addWorkExperience = useCallback(() => {
    const idValue = Number(formState.workExperienceIdText.trim());
    if (!Number.isFinite(idValue) || idValue <= 0) {
      return;
    }
    setFormState((prev) => {
      if (prev.workExperiences.some((item) => item.universeId === idValue)) {
        return { ...prev, workExperienceIdText: '' };
      }
      if (prev.workExperiences.length >= 3) {
        return prev;
      }
      return {
        ...prev,
        workExperienceIdText: '',
        workExperiences: [
          ...prev.workExperiences,
          {
            universeId: idValue,
            title: `Experience ${idValue}`,
          },
        ],
      };
    });
  }, [formState.workExperienceIdText]);

  const removeWorkExperience = useCallback((universeId: number) => {
    setFormState((prev) => ({
      ...prev,
      workExperiences: prev.workExperiences.filter((item) => item.universeId !== universeId),
    }));
  }, []);

  const reorderWorkExperiences = useCallback((sourceId: number, targetId: number) => {
    if (sourceId === targetId) {
      return;
    }
    setFormState((prev) => {
      const sourceIndex = prev.workExperiences.findIndex((item) => item.universeId === sourceId);
      const targetIndex = prev.workExperiences.findIndex((item) => item.universeId === targetId);
      if (sourceIndex < 0 || targetIndex < 0) {
        return prev;
      }
      const next = [...prev.workExperiences];
      const [sourceItem] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, sourceItem);
      return { ...prev, workExperiences: next };
    });
  }, []);

  const handleExperienceDragStart = useCallback((universeId: number) => {
    setDraggingExperienceId(universeId);
  }, []);

  const handleExperienceDragEnd = useCallback(() => {
    setDraggingExperienceId(null);
  }, []);

  const handleExperienceDrop = useCallback(
    (targetId: number) => {
      if (draggingExperienceId == null) {
        return;
      }
      reorderWorkExperiences(draggingExperienceId, targetId);
      setDraggingExperienceId(null);
    },
    [draggingExperienceId, reorderWorkExperiences],
  );

  const errors = useMemo(
    () => ({
      displayName: formState.displayName.trim() ? '' : 'Full name is required.',
      role: formState.jobFunction ? '' : 'Role is required.',
    }),
    [formState.displayName, formState.jobFunction],
  );

  const isValid = useMemo(() => Object.values(errors).every((v) => v === ''), [errors]);

  const handleSubmit = useCallback(() => {
    setHasSubmitted(true);
    if (!isValid) {
      return;
    }
    onSubmit(formStateToPayload(formState));
  }, [formState, isValid, onSubmit]);

  useImperativeHandle(ref, () => ({ submit: handleSubmit }), [handleSubmit]);

  React.useEffect(() => {
    onValidityChange?.({ isValid, hasSubmitted });
  }, [isValid, hasSubmitted, onValidityChange]);

  const title = mode === 'create' ? 'Create profile' : 'Edit profile';
  const defaultSubmitLabel = mode === 'create' ? 'Create profile' : 'Save profile';
  const profileFormBody = (
    <>
      <div className='gap-large flex flex-col'>
        <div className='text-title-large'>{title}</div>
        <div className='gap-small flex flex-col'>
          {user?.id ? (
            <div className={styles.profileAvatarWrap}>
              <div className={styles.profileAvatar}>
                <Thumbnail2d
                  targetId={user.id}
                  type={ThumbnailTypes.avatarHeadshot}
                  alt={formState.displayName || user?.name || 'Avatar'}
                  returnPolicy={ReturnPolicy.PlaceHolder}
                  containerClass={styles.thumbnailFill}
                  imgClassName={styles.thumbnailFillImg}
                />
              </div>
            </div>
          ) : null}
          <div className='gap-xxsmall flex flex-col'>
            <span className='content-muted text-label-small'>Username</span>
            <span className='text-body-medium'>{`@${robloxUsername || 'unknown'}`}</span>
          </div>
        </div>
      </div>

      <div className='gap-medium flex flex-col'>
        <TextInput
          label='Full name'
          isRequired
          placeholder='ex: John Smith'
          value={formState.displayName}
          onChange={(event) => setField('displayName', event.target.value)}
          hasError={hasSubmitted && !!errors.displayName}
          error={hasSubmitted ? errors.displayName : ''}
        />
        <div className='gap-xxsmall flex flex-col'>
          <span className='text-label-large'>Role *</span>
          <Dropdown
            className='width-full'
            size='Large'
            value={formState.jobFunction}
            placeholder='Select role'
            onValueChange={(value) => setField('jobFunction', value)}>
            <Menu>
              {JOB_FUNCTION_OPTIONS.map(([value, label]) => (
                <MenuItem key={value} value={String(value)} title={label} />
              ))}
            </Menu>
          </Dropdown>
          {hasSubmitted && errors.role ? (
            <div className='content-alert text-body-small'>{errors.role}</div>
          ) : null}
        </div>
        <div className='gap-xxsmall flex flex-col'>
          <span className='text-title-large'>About</span>
          <TextArea
            aria-label='About'
            rows={4}
            placeholder='Tell employers about you, your work experience and your skills.'
            value={formState.bio}
            onChange={(event) => setField('bio', event.target.value)}
          />
        </div>
        <TextInput
          label='Email'
          placeholder='Use your primary or business email address.'
          value={formState.contactEmail}
          onChange={() => {}}
          isDisabled
          helperText='To change your email, update it on your profile page.'
        />
        <TextInput
          label='Website'
          placeholder='Your portfolio or other websites that showcase your work.'
          value={formState.website}
          onChange={(event) => setField('website', event.target.value)}
        />
        <TextInput
          label='Location'
          placeholder='San Francisco, CA'
          value={formState.location}
          onChange={(event) => setField('location', event.target.value)}
        />

        <RadioGroup
          groupLabel='Open to relocation? *'
          value={formState.relocationChoice}
          onValueChange={(value) => {
            if (isRelocationChoice(value)) {
              setField('relocationChoice', value);
            }
          }}
          size='Small'>
          <Radio value='no' label='No, I’m not open to relocation' />
          <Radio value='yes' label='Yes, I’m open to relocation' />
          <Radio value='remoteOnly' label='I’m open to remote work only' />
        </RadioGroup>

        <div
          className={`gap-medium flex flex-col ${mode === 'create' ? styles.profileCreateCreationsSection : styles.profileEditCreationsSection}`}>
          <div className='gap-xxsmall flex flex-col'>
            <span className='text-label-large'>Creations I’ve worked on</span>
            <span className='content-muted text-body-small'>
              Choose up to 3 creations to highlight on your profile. Click and drag to indicate the
              order.
            </span>
          </div>
          <div className={`items-end gap-small flex ${styles.profileExperienceInputRow}`}>
            <div className='flex-1'>
              <TextInput
                label='Experience ID'
                placeholder='e.g. 920587237'
                value={formState.workExperienceIdText}
                onChange={(event) => setField('workExperienceIdText', event.target.value)}
              />
            </div>
            <Button
              className={styles.profileExperienceAddButton}
              variant='Standard'
              size='Medium'
              onClick={addWorkExperience}
              isDisabled={
                formState.workExperienceIdText.trim().length === 0 ||
                formState.workExperiences.length >= 3
              }>
              Add
            </Button>
          </div>
          <div className={styles.profileExperienceRows}>
            {formState.workExperiences.map((item) => (
              <div
                key={item.universeId}
                className={styles.profileExperienceRow}
                draggable
                onDragStart={() => handleExperienceDragStart(item.universeId)}
                onDragEnd={handleExperienceDragEnd}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleExperienceDrop(item.universeId)}>
                <div className='items-center min-width-0 gap-small flex'>
                  <div className={styles.profileExperienceThumb}>
                    <Thumbnail2d
                      targetId={item.universeId}
                      type={ThumbnailTypes.universeThumbnail}
                      returnPolicy={ReturnPolicy.PlaceHolder}
                      containerClass={styles.thumbnailFill}
                      imgClassName={styles.profileExperienceThumbImg}
                      alt={experienceNameByUniverseId.get(item.universeId) ?? item.title}
                    />
                  </div>
                  <div className='min-width-0 gap-xxsmall flex flex-col'>
                    <span className='text-body-medium text-truncate-end'>
                      {experienceNameByUniverseId.get(item.universeId) ?? item.title}
                    </span>
                    <span className='content-muted text-body-small'>[{item.universeId}]</span>
                  </div>
                </div>
                <div className='items-center gap-small flex'>
                  <Button
                    variant='Standard'
                    size='Small'
                    onClick={() => removeWorkExperience(item.universeId)}>
                    Remove
                  </Button>
                  <span className={styles.profileDragHandle} aria-hidden='true'>
                    <span />
                    <span />
                    <span />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className={mode === 'create' ? styles.profileCreateShell : undefined}>
      {profileFormBody}

      {hideActions ? null : (
        <div className='gap-small flex flex-col'>
          {submitError ? (
            <FeedbackBanner
              title=''
              description={submitError}
              layout='Inline'
              variant='Standard'
              severity='Error'
            />
          ) : null}
          <div
            className={`gap-small flex flex-col small:flex-row ${
              mode === 'create'
                ? styles.profileCreateActions
                : `${styles.equalButtons} ${styles.profileEditActions}`
            }`}>
            <Button
              variant='Emphasis'
              size='Medium'
              onClick={handleSubmit}
              isLoading={isSaving}
              isDisabled={!isValid || isSaving}>
              {submitLabel ?? defaultSubmitLabel}
            </Button>
            {onCancel ? (
              <Button variant='Standard' size='Medium' onClick={onCancel}>
                Cancel
              </Button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
});

export const ProfileForm = ProfileFormImpl;

export default ProfileForm;
