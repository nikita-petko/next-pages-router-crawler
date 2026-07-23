import React, { useCallback, useEffect, useMemo, useState } from 'react';
import NextHead from 'next/head';
import { useRouter } from 'next/router';
import {
  Button,
  Dropdown,
  FeedbackBanner,
  Icon,
  Menu,
  MenuItem,
  TextArea,
  TextInput,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { logJobPostSubmit, logPostJobPageView } from '../analytics';
import { LoadingState } from '../components/feedback/LoadingState';
import PageContent from '../components/shared/PageContent';
import {
  API_JOB_FUNCTION_LABELS,
  API_JOB_TYPE_LABELS,
  STUDIO_ONBOARDING_SURVEY_URL,
  getUniqueJobFunctionOptions,
} from '../constants';
import { useCreateJob } from '../hooks/useJobMutations';
import { useStudioPermissions } from '../hooks/useMyStudios';
import type { CreateJobRequest, JobFunction, JobType } from '../types';
import { composeDescriptionWithWorkLocation, JOB_WORK_ARRANGEMENTS } from '../utils';
import styles from '../components/shared/Layout.module.css';

type FormState = {
  title: string;
  jobFunction: string;
  jobType: string;
  location: string;
  locationDetail: string;
  applyMethod: string;
  description: string;
  responsibilities: string;
  qualifications: string;
};

const JOB_FUNCTION_OPTIONS = getUniqueJobFunctionOptions();

const JOB_TYPE_OPTIONS = Object.entries(API_JOB_TYPE_LABELS);

const DEFAULT_FORM: FormState = {
  title: '',
  jobFunction: '',
  jobType: '',
  location: '',
  locationDetail: '',
  applyMethod: '',
  description: '',
  responsibilities: '',
  qualifications: '',
};

function isJobFunctionValue(value: number): value is JobFunction {
  return Object.hasOwn(API_JOB_FUNCTION_LABELS, value);
}

function isJobTypeValue(value: number): value is JobType {
  return Object.hasOwn(API_JOB_TYPE_LABELS, value);
}

export function StudioOnboardingSurveyCTA() {
  const { translate } = useTranslation();
  const handleStartSurvey = useCallback(() => {
    window.open(STUDIO_ONBOARDING_SURVEY_URL, '_blank', 'noopener,noreferrer');
  }, []);
  return (
    <PageContent testId='talent-hub-v2-onboarding-survey'>
      <div className={styles.appliedEmptyState}>
        <Icon name='icon-regular-person' size='XLarge' />
        <div className='text-align-center text-heading-medium'>
          {translate('Heading.GetYourStudioOnTalentHub')}
        </div>
        <div
          className={`text-align-center content-muted text-body-medium ${styles.appliedEmptyText}`}>
          {translate('Description.GetYourStudioOnTalentHub')}
        </div>
        <Button variant='Emphasis' size='Medium' onClick={handleStartSurvey}>
          {translate('Action.StartOnboardingSurvey')}
        </Button>
      </div>
    </PageContent>
  );
}

/**
 * Studio job-post onboarding.
 *
 * Gated by {@link useStudioPermissions}: a studio with backend `write` permission
 * sees the in-product Post-a-Job form. Anyone else (no `?studioId=`, no backend
 * record, or no `write` permission) is funneled to the Qualtrics onboarding
 * survey since `POST /api/Studios` is still manual-review gated.
 */
type StudioOnboardingV2ContainerProps = {
  /**
   * Studio to post under. If omitted, falls back to a `?studioId=` query
   * param (used by internal testing). In the default `/hire/my-studio/post-job`
   * flow the page passes in the current account's studio directly.
   */
  studioId?: string;
};

export const StudioOnboardingV2Container: React.FC<StudioOnboardingV2ContainerProps> = ({
  studioId,
}) => {
  const { translate } = useTranslation();
  const router = useRouter();
  const tr = useCallback(
    (key: string, fallback: string) => {
      const value = translate(key);
      return value && value !== key ? value : fallback;
    },
    [translate],
  );
  const studioIdParam =
    studioId ?? (typeof router.query.studioId === 'string' ? router.query.studioId : undefined);

  const { canManageJobs, isLoading: isPermissionLoading } = useStudioPermissions(studioIdParam);

  useEffect(() => {
    if (studioIdParam) {
      logPostJobPageView(studioIdParam);
    }
  }, [studioIdParam]);

  const createJob = useCreateJob();

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const applyMethodHelperText = 'Link where you’ve posted the job externally';

  const updateField = useCallback(
    <K extends keyof FormState>(field: K, value: FormState[K]) =>
      setForm((prev) => ({ ...prev, [field]: value })),
    [],
  );

  const { isValid, applyMethodUrlInvalid } = useMemo(() => {
    const applyTrimmed = form.applyMethod.trim();
    const applyUrlInvalid = applyTrimmed.length > 0 && !/^https?:\/\//i.test(applyTrimmed);
    return {
      applyMethodUrlInvalid: applyUrlInvalid,
      isValid:
        form.title.trim().length > 0 &&
        form.jobFunction.length > 0 &&
        form.jobType.length > 0 &&
        form.location.length > 0 &&
        form.description.trim().length > 0 &&
        form.responsibilities.trim().length > 0 &&
        form.qualifications.trim().length > 0 &&
        !applyUrlInvalid,
    };
  }, [form]);

  const qaParams = useMemo(() => {
    const qs = new URLSearchParams();
    const { th2, th2m2, mocks, local } = router.query;
    if (typeof th2 === 'string') {
      qs.set('th2', th2);
    }
    if (typeof th2m2 === 'string') {
      qs.set('th2m2', th2m2);
    }
    if (typeof mocks === 'string') {
      qs.set('mocks', mocks);
    }
    if (typeof local === 'string') {
      qs.set('local', local);
    }
    return qs.toString();
  }, [router.query]);

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  const handleSubmit = useCallback(
    async (event: React.SyntheticEvent) => {
      event.preventDefault();
      setHasSubmitted(true);
      setSaveError(null);
      if (!isValid || !studioIdParam) {
        return;
      }

      try {
        // `locationDetail` is not on CreateJobRequest (OpenAPI additionalProperties: false);
        // specific place names are appended to `description` — see composeDescriptionWithWorkLocation.
        const descriptionForApi = composeDescriptionWithWorkLocation(
          form.description.trim(),
          form.location.trim(),
          form.locationDetail.trim(),
        );
        const trimmedApplyMethod = form.applyMethod.trim();
        const nextJobFunction = Number(form.jobFunction);
        const nextJobType = Number(form.jobType);
        if (!isJobFunctionValue(nextJobFunction) || !isJobTypeValue(nextJobType)) {
          setSaveError(translate('Error.FailedToPostJob'));
          return;
        }
        const payload: CreateJobRequest = {
          studioId: studioIdParam,
          title: form.title.trim(),
          _function: nextJobFunction,
          jobType: nextJobType,
          location: form.location.trim(),
          applyMethod: trimmedApplyMethod,
          description: descriptionForApi,
          responsibilities: form.responsibilities.trim(),
          qualifications: form.qualifications.trim(),
        };
        await createJob.mutateAsync(payload);
        logJobPostSubmit(studioIdParam);
        const suffix = qaParams ? `?${qaParams}` : '';
        void router.push(`/hire/studios/${studioIdParam}${suffix}`);
      } catch {
        setSaveError(translate('Error.FailedToPostJob'));
      }
    },
    [createJob, form, isValid, qaParams, router, studioIdParam, translate],
  );

  if (isPermissionLoading) {
    return <LoadingState itemCount={4} />;
  }

  if (!studioIdParam || !canManageJobs) {
    return (
      <>
        <NextHead>
          <title>{translate('Heading.OnboardYourStudio')}</title>
          <meta
            name='description'
            content={translate('Description.GetYourStudioListedToPostJobs')}
            key='description'
          />
        </NextHead>
        <StudioOnboardingSurveyCTA />
      </>
    );
  }

  return (
    <>
      <NextHead>
        <title>{translate('Text.PostAJobTitle')}</title>
        <meta
          name='description'
          content={translate('Text.PostAJobDescription')}
          key='description'
        />
        <meta property='og:title' content={translate('Text.PostAJobTitle')} key='og:title' />
        <meta
          property='og:description'
          content={translate('Text.PostAJobDescription')}
          key='og:description'
        />
      </NextHead>
      <PageContent
        as='form'
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        testId='talent-hub-v2-onboarding'
        className={styles.postJobShell}>
        <div>
          <div className='text-heading-large'>{translate('Heading.PostAJob')}</div>
          <div className='margin-top-small content-muted text-body-medium'>
            Please include enough detail to attract quality talent.
          </div>
        </div>

        {saveError ? (
          <FeedbackBanner
            title=''
            description={saveError}
            layout='Inline'
            variant='Standard'
            severity='Error'
          />
        ) : null}

        <div className={styles.postJobFormFields}>
          <TextInput
            label={translate('Label.Position')}
            value={form.title}
            onChange={(event) => updateField('title', event.target.value)}
            isRequired
            hasError={hasSubmitted && form.title.trim().length === 0}
            error={
              hasSubmitted && form.title.trim().length === 0
                ? translate('Error.PositionRequired')
                : ''
            }
            placeholder='Software Engineer — [Your Game Name]'
          />

          <div className={styles.postJobFieldsGrid}>
            <div className={styles.postJobField}>
              <span className='text-label-large'>{translate('FunctionStar')}</span>
              <Dropdown
                className='width-full'
                size='Large'
                value={form.jobFunction}
                placeholder={translate('Dropdown.SelectFunction')}
                onValueChange={(v) => updateField('jobFunction', v)}>
                <Menu>
                  {JOB_FUNCTION_OPTIONS.map(([value, label]) => (
                    <MenuItem key={value} value={String(value)} title={label} />
                  ))}
                </Menu>
              </Dropdown>
              {hasSubmitted && form.jobFunction.length === 0 ? (
                <div className='content-alert text-body-small'>
                  {translate('Error.JobFunctionsRequired')}
                </div>
              ) : null}
            </div>
            <div className={styles.postJobField}>
              <span className='text-label-large'>{translate('JobTypeStar')}</span>
              <Dropdown
                className='width-full'
                size='Large'
                value={form.jobType}
                placeholder={translate('Dropdown.SelectType')}
                onValueChange={(v) => updateField('jobType', v)}>
                <Menu>
                  {JOB_TYPE_OPTIONS.map(([value, label]) => (
                    <MenuItem key={value} value={value} title={label} />
                  ))}
                </Menu>
              </Dropdown>
              {hasSubmitted && form.jobType.length === 0 ? (
                <div className='content-alert text-body-small'>
                  {translate('Error.JobTypeRequired')}
                </div>
              ) : null}
            </div>
            <div className={styles.postJobField}>
              <span className='text-label-large'>{translate('LocationStar')}</span>
              <Dropdown
                className='width-full'
                size='Large'
                value={form.location}
                placeholder={translate('Dropdown.SelectLocation')}
                onValueChange={(v) => updateField('location', v)}>
                <Menu>
                  {JOB_WORK_ARRANGEMENTS.map((value) => (
                    <MenuItem key={value} value={value} title={value} />
                  ))}
                </Menu>
              </Dropdown>
              {hasSubmitted && form.location.length === 0 ? (
                <div className='content-alert text-body-small'>
                  {translate('Error.LocationRequired')}
                </div>
              ) : null}
              <div className='margin-top-medium'>
                <TextInput
                  label={translate('Description.LocationFreeform')}
                  value={form.locationDetail}
                  onChange={(event) => updateField('locationDetail', event.target.value)}
                  placeholder='San Francisco, CA'
                />
              </div>
            </div>
          </div>

          <TextArea
            label={`${translate('Heading.AboutTheRole')} *`}
            value={form.description}
            onChange={(event) => updateField('description', event.target.value)}
            hasError={hasSubmitted && form.description.trim().length === 0}
            placeholder='[Your Studio] is hiring a Software Engineer to join the team behind [Your Game Name], one of the top experiences on Roblox. You will ship player-facing features, improve performance across client and server, and work closely with designers and artists to bring new ideas to life. This is a full-time, fully remote role open to candidates worldwide.'
            rows={6}
          />
          {hasSubmitted && form.description.trim().length === 0 ? (
            <div className='content-alert text-body-small'>
              {translate('Error.AboutRoleRequired')}
            </div>
          ) : null}

          <TextArea
            label={`${translate('Heading.Responsibilities')} *`}
            value={form.responsibilities}
            onChange={(event) => updateField('responsibilities', event.target.value)}
            hasError={hasSubmitted && form.responsibilities.trim().length === 0}
            placeholder='Design, build, and maintain gameplay systems in Luau across client and server
Partner with designers, artists, and producers to scope and ship new features
Debug live issues, optimize performance, and raise the technical bar of the codebase
Mentor other engineers through code reviews and technical design discussions'
            rows={6}
          />
          {hasSubmitted && form.responsibilities.trim().length === 0 ? (
            <div className='content-alert text-body-small'>
              {translate('Error.ResponsibilitiesRequired')}
            </div>
          ) : null}

          <TextArea
            label={`${translate('Heading.Requirements')} *`}
            value={form.qualifications}
            onChange={(event) => updateField('qualifications', event.target.value)}
            hasError={hasSubmitted && form.qualifications.trim().length === 0}
            placeholder='3+ years of professional software engineering experience, ideally shipping live games
Strong Luau or Lua skills and deep familiarity with Roblox Studio
Experience owning features end-to-end, from design doc through live release
Clear written communication and the ability to work independently in a remote team'
            rows={6}
          />
          {hasSubmitted && form.qualifications.trim().length === 0 ? (
            <div className='content-alert text-body-small'>
              {translate('Error.RequirementsRequired')}
            </div>
          ) : null}

          <div className='gap-xxsmall flex flex-col'>
            <div className='text-title-large content-emphasis'>External job link (optional)</div>
            <TextInput
              value={form.applyMethod}
              onChange={(event) => updateField('applyMethod', event.target.value)}
              hasError={applyMethodUrlInvalid}
              error={
                applyMethodUrlInvalid
                  ? tr(
                      'Error.ValidExternalApplicationUrlRequired',
                      'Enter a valid URL that starts with http:// or https://.',
                    )
                  : ''
              }
              helperText={applyMethodHelperText}
              placeholder='https://api.ashbyhq.com/posting-api/your_link_here'
            />
            {applyMethodUrlInvalid ? (
              <div className='content-alert text-body-small'>
                {tr('Description.IncludeHttpOrHttps', 'Include http:// or https://.')}
              </div>
            ) : null}
          </div>
        </div>

        <div className='gap-small flex flex-col small:flex-row'>
          <Button
            type='submit'
            variant='Emphasis'
            size='Medium'
            isLoading={createJob.isPending}
            isDisabled={!isValid || createJob.isPending}>
            {translate('Action.Post')}
          </Button>
          <Button type='button' variant='Standard' size='Medium' onClick={handleCancel}>
            {translate('Action.Cancel')}
          </Button>
        </div>
      </PageContent>
    </>
  );
};

export default StudioOnboardingV2Container;
