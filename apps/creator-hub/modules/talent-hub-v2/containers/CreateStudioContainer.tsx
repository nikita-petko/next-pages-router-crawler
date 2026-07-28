import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { Button, FeedbackBanner } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { useCurrentGroup } from '../../providers/groups/GroupsProvider';
import { logCreateStudioError, logCreateStudioSubmit, logCreateStudioSuccess } from '../analytics';
import PageContent from '../components/shared/PageContent';
import { StudioFormFields, type StudioFormErrors } from '../components/studios/StudioFormFields';
import {
  EMPTY_STUDIO_FORM_STATE,
  toCreateStudioRequest,
  type StudioFormState,
} from '../components/studios/StudioFormFields.types';
import { hasSubdivisionDropdown } from '../constants/incorporationLocations';
import { useCreateStudio } from '../hooks/useCreateStudio';
import { useMyStudios } from '../hooks/useMyStudios';
import { parseGroupUrl } from '../utils/parseGroupUrl';

type SubmitErrorKind = 'forbidden' | 'validation' | 'server' | null;

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const DESCRIPTION_MAX_CHARS = 500;

function validateStudioForm(state: StudioFormState): StudioFormErrors {
  const errors: StudioFormErrors = {};
  if (state.name.trim().length === 0) {
    errors.name = 'Required';
  }
  if (state.legalBusinessName.trim().length === 0) {
    errors.legalBusinessName = 'Required';
  }
  if (state.countryOfIncorporation.length === 0) {
    errors.countryOfIncorporation = 'Required';
  }
  // For dropdown countries (US, CA), require an explicit code; for free-text
  // fallbacks, accept any non-blank string.
  if (state.countryOfIncorporation.length > 0) {
    const isDropdown = hasSubdivisionDropdown(state.countryOfIncorporation);
    const stateValue = state.stateOfIncorporation.trim();
    if (stateValue.length === 0) {
      errors.stateOfIncorporation = 'Required';
    } else if (isDropdown && state.stateOfIncorporation.length === 0) {
      errors.stateOfIncorporation = 'Required';
    }
  } else if (state.stateOfIncorporation.trim().length === 0) {
    errors.stateOfIncorporation = 'Required';
  }
  const site = state.website.trim();
  if (site.length === 0) {
    errors.website = 'Required';
  } else if (!/^https?:\/\//i.test(site)) {
    errors.website = 'Must start with http(s)://';
  }
  if (!EMAIL_RE.test(state.email.trim())) {
    errors.email = 'Invalid email';
  }
  const description = state.description.trim();
  if (description.length === 0) {
    errors.description = 'Required';
  } else if (description.length > DESCRIPTION_MAX_CHARS) {
    errors.description = `Description must be ${DESCRIPTION_MAX_CHARS} characters or fewer`;
  }
  if (state.teamSize === null) {
    errors.teamSize = 'Required';
  }
  if (!parseGroupUrl(state.groupUrl).ok) {
    errors.groupUrl = 'Invalid group URL or ID';
  }
  return errors;
}

function isRecord(value: unknown): value is Record<PropertyKey, unknown> {
  return typeof value === 'object' && value !== null;
}

function readResponseStatus(error: unknown): number | undefined {
  if (!isRecord(error)) {
    return undefined;
  }
  const response = error.response;
  if (!isRecord(response)) {
    return undefined;
  }
  const status = response.status;
  return typeof status === 'number' ? status : undefined;
}

export function CreateStudioContainer() {
  const router = useRouter();
  const { translate } = useTranslation();
  const currentGroup = useCurrentGroup();
  const { data: studiosData, isLoading: studiosLoading } = useMyStudios();
  const createMutation = useCreateStudio();

  const [state, setState] = useState<StudioFormState>(() => ({
    ...EMPTY_STUDIO_FORM_STATE,
    groupUrl: currentGroup
      ? `https://www.roblox.com/communities/${currentGroup.id}/${currentGroup.name}`
      : '',
  }));

  const [submitError, setSubmitError] = useState<SubmitErrorKind>(null);
  const [touched, setTouched] = useState<Partial<Record<keyof StudioFormState, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [focusedField, setFocusedField] = useState<keyof StudioFormState | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!studiosLoading && (studiosData?.studios.length ?? 0) > 0) {
      void router.replace('/hire/my-studio');
    }
  }, [studiosData, studiosLoading, router]);

  // Track focus at the form-container level via event delegation. We use the
  // `data-th2-field` attribute already set on each field wrapper to know which
  // logical field a focus event belongs to. This drives two UX behaviors:
  // 1. The currently-focused field never shows a red error (so the user does
  //    not see "Invalid email" while still typing their email).
  // 2. A field becomes "touched" on blur, not on every keystroke, so errors
  //    only appear once the user has finished editing and moved on.
  useEffect(() => {
    const root = formRef.current;
    if (!root) {
      return undefined;
    }
    const fieldFromEvent = (event: FocusEvent): keyof StudioFormState | null => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return null;
      }
      const wrapper = target.closest('[data-th2-field]');
      if (!(wrapper instanceof HTMLElement)) {
        return null;
      }
      const field = wrapper.dataset.th2Field;
      if (field === undefined || field.length === 0) {
        return null;
      }
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- data-th2-field values are statically authored against StudioFormState keys.
      return field as keyof StudioFormState;
    };
    const handleFocusIn = (event: FocusEvent) => {
      const field = fieldFromEvent(event);
      if (field) {
        setFocusedField(field);
      }
    };
    const handleFocusOut = (event: FocusEvent) => {
      const field = fieldFromEvent(event);
      if (!field) {
        return;
      }
      setFocusedField((current) => (current === field ? null : current));
      setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
    };
    root.addEventListener('focusin', handleFocusIn);
    root.addEventListener('focusout', handleFocusOut);
    return () => {
      root.removeEventListener('focusin', handleFocusIn);
      root.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  const allErrors = validateStudioForm(state);

  // Suppress validation errors on fields the user has not yet touched, so a
  // freshly-loaded form is not littered with red. Also hide the error for the
  // field the user is currently focused on, so they do not see red while they
  // are mid-edit. After a submit attempt we reveal every error EXCEPT the
  // focused one (so they can fix the focused field without flicker).
  const errors = useMemo<StudioFormErrors>(() => {
    const visible: StudioFormErrors = {};
    for (const [k, message] of Object.entries(allErrors)) {
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- key narrows from string to known StudioFormErrors key (allErrors is built from a fixed-shape state).
      const key = k as keyof StudioFormErrors;
      if (message === undefined) {
        continue;
      }
      if (key === focusedField) {
        continue;
      }
      if (submitAttempted || touched[key]) {
        visible[key] = message;
      }
    }
    return visible;
  }, [allErrors, touched, submitAttempted, focusedField]);

  const handleChange = (next: StudioFormState) => {
    setState(next);
  };

  const tr = (key: string, fallback: string) => {
    const value = translate(key);
    return value && value !== key ? value : fallback;
  };

  // QA flags should survive the navigation back to the profile page so the
  // post-create snackbar still appears under `?mocks=1&local=1` etc.
  const successUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set('created', '1');
    for (const key of ['th2', 'th2m2', 'mocks', 'local'] as const) {
      const raw = router.query[key];
      if (typeof raw === 'string') {
        params.set(key, raw);
      }
    }
    return `/hire/my-studio?${params.toString()}`;
  }, [router.query]);

  const handleCancel = () => {
    const qaParams = new URLSearchParams();
    for (const key of ['th2', 'th2m2', 'mocks', 'local', 'noStudios'] as const) {
      const raw = router.query[key];
      if (typeof raw === 'string') {
        qaParams.set(key, raw);
      }
    }
    const suffix = qaParams.toString();
    void router.push(`/hire/my-studio/onboard${suffix ? `?${suffix}` : ''}`);
  };

  const onSubmit = async () => {
    setSubmitAttempted(true);
    if (Object.keys(allErrors).length > 0) {
      // Surface the first error to the user instead of letting them keep
      // clicking a button that silently does nothing. We look up the field by
      // a `data-th2-field` attribute set on the wrapping div so the scroll
      // target is the field group (not just the input), giving the label
      // context. Falls back to the first `[aria-invalid="true"]` if the
      // attribute isn't present (e.g. dropdown errors rendered as siblings).
      if (typeof window !== 'undefined') {
        const firstKey = Object.keys(allErrors)[0];
        if (firstKey !== undefined) {
          const target =
            document.querySelector(`[data-th2-field="${firstKey}"]`) ??
            document.querySelector('[aria-invalid="true"]');
          // jsdom (used in unit tests) does not implement scrollIntoView, so
          // we feature-detect rather than call blindly.
          if (target instanceof HTMLElement && typeof target.scrollIntoView === 'function') {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }
      return;
    }
    logCreateStudioSubmit();
    setSubmitError(null);
    try {
      const studio = await createMutation.mutateAsync(toCreateStudioRequest(state));
      if (studio.groupId != null) {
        logCreateStudioSuccess(studio.groupId);
      }
      void router.push(successUrl);
    } catch (error: unknown) {
      const status = readResponseStatus(error);
      logCreateStudioError(status);
      if (status === 403) {
        setSubmitError('forbidden');
      } else if (status === 409) {
        void router.push(successUrl);
      } else if (status !== undefined && status >= 400 && status < 500) {
        setSubmitError('validation');
      } else {
        setSubmitError('server');
      }
    }
  };

  const nextLabel = tr('Action.Next', 'Next');
  const cancelLabel = tr('Action.Cancel', 'Cancel');

  return (
    <PageContent testId='create-studio-form' gap='medium'>
      <div className='gap-medium flex flex-col' ref={formRef}>
        <div className='text-heading-large'>
          {tr('Heading.TellUsAboutYourStudio', 'Tell us about your studio')}
        </div>

        {submitError === 'forbidden' ? (
          <FeedbackBanner
            description={tr(
              'Error.StudioCreateForbidden',
              "You don't have permission to create a studio for this group.",
            )}
            layout='Inline'
            severity='Error'
            title=''
            variant='Standard'
          />
        ) : null}
        {submitError === 'validation' ? (
          <FeedbackBanner
            description={tr(
              'Error.StudioCreateValidation',
              'We could not submit your studio profile. Check your details and try again.',
            )}
            layout='Inline'
            severity='Error'
            title=''
            variant='Standard'
          />
        ) : null}
        {submitError === 'server' ? (
          <FeedbackBanner
            description={tr('Error.StudioCreateServer', 'Something went wrong. Please try again.')}
            layout='Inline'
            severity='Error'
            title=''
            variant='Standard'
          />
        ) : null}

        <StudioFormFields errors={errors} mode='create' onChange={handleChange} state={state} />

        <div className='gap-small flex'>
          <Button
            isDisabled={createMutation.isPending}
            isLoading={createMutation.isPending}
            onClick={() => void onSubmit()}
            size='Medium'
            variant='Emphasis'>
            {nextLabel}
          </Button>
          <Button
            isDisabled={createMutation.isPending}
            onClick={handleCancel}
            size='Medium'
            variant='Standard'>
            {cancelLabel}
          </Button>
        </div>
      </div>
    </PageContent>
  );
}
