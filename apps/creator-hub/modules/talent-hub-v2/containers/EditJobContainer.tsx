import React, { useCallback, useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Button,
  Dropdown,
  FeedbackBanner,
  Menu,
  MenuItem,
  TextInput,
  TextArea,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { ErrorState } from '../components/feedback/ErrorState';
import { LoadingState } from '../components/feedback/LoadingState';
import PageContent from '../components/shared/PageContent';
import {
  API_JOB_FUNCTION_LABELS,
  API_JOB_TYPE_LABELS,
  getUniqueJobFunctionOptions,
} from '../constants';
import { useUpdateJob } from '../hooks/useJobMutations';
import { useJob } from '../hooks/useJobs';
import type { JobFunction, JobType, UpdateJobRequest } from '../types';
import {
  composeDescriptionWithWorkLocation,
  JOB_WORK_ARRANGEMENTS,
  parseStoredJobLocation,
  splitDescriptionWorkLocation,
} from '../utils';
import styles from '../components/shared/Layout.module.css';

type EditJobContainerProps = {
  jobId: string;
};

function isJobFunctionValue(value: number): value is JobFunction {
  return Object.hasOwn(API_JOB_FUNCTION_LABELS, value);
}

function isJobTypeValue(value: number): value is JobType {
  return Object.hasOwn(API_JOB_TYPE_LABELS, value);
}

export const EditJobContainer: React.FC<EditJobContainerProps> = ({ jobId }) => {
  const { translate } = useTranslation();
  const router = useRouter();
  const tr = useCallback(
    (key: string, fallback: string) => {
      const value = translate(key);
      return value && value !== key ? value : fallback;
    },
    [translate],
  );
  const { data: job, isLoading, error: loadError } = useJob(jobId);
  const updateJob = useUpdateJob(jobId);

  type FormState = {
    title: string;
    jobFunction: JobFunction;
    jobType: JobType;
    location: string;
    locationDetail: string;
    applyMethod: string;
    description: string;
    responsibilities: string;
    qualifications: string;
  };

  const [form, setForm] = useState<FormState>({
    title: '',
    jobFunction: 0,
    jobType: 0,
    location: '',
    locationDetail: '',
    applyMethod: '',
    description: '',
    responsibilities: '',
    qualifications: '',
  });
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const jobFunctionOptions = getUniqueJobFunctionOptions();
  const jobTypeOptions = Object.entries(API_JOB_TYPE_LABELS);
  const applyMethodUrlInvalid =
    form.applyMethod.trim().length > 0 && !/^https?:\/\//i.test(form.applyMethod.trim());
  const applyMethodHelperText = `${translate('Description.RedirectCreatorsToApply')} ${tr('Description.IncludeHttpOrHttps', 'Include http:// or https://.')}`;

  useEffect(() => {
    if (job) {
      const { arrangement, legacyDetailFromLocationField } = parseStoredJobLocation(job.location);
      const { body, detail: detailFromDescription } = splitDescriptionWorkLocation(
        job.description ?? '',
      );
      // eslint-disable-next-line no-underscore-dangle -- generated API field name
      const nextJobFunction = job._function ?? 0;
      const nextJobType = job.jobType ?? 0;
      setForm({
        title: job.title ?? '',
        jobFunction: isJobFunctionValue(nextJobFunction) ? nextJobFunction : 0,
        jobType: isJobTypeValue(nextJobType) ? nextJobType : 0,
        location: arrangement || 'Remote',
        locationDetail: detailFromDescription || legacyDetailFromLocationField,
        applyMethod: job.applyMethod ?? '',
        description: body,
        responsibilities: job.responsibilities ?? '',
        qualifications: job.qualifications ?? '',
      });
    }
  }, [job]);

  const updateField = useCallback(
    <K extends keyof FormState>(field: K, value: FormState[K]) =>
      setForm((prev) => ({ ...prev, [field]: value })),
    [],
  );

  const qaParams = (() => {
    const qs = new URLSearchParams();
    const { th2, th2m2, mocks, from, local } = router.query;
    if (from === 'profile') {
      qs.set('from', 'profile');
    }
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
  })();

  const backBaseHref =
    router.query.from === 'profile' ? `/hire/jobs/${jobId}` : `/hire/my-studio/jobs/${jobId}`;
  const backHref = `${backBaseHref}${qaParams ? `?${qaParams}` : ''}`;
  const handleCancel = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    void router.push(backHref);
  }, [router, backHref]);

  const handleSave = useCallback(async () => {
    setSaveError(null);
    setIsSuccess(false);
    try {
      const descriptionForApi = composeDescriptionWithWorkLocation(
        form.description,
        form.location,
        form.locationDetail,
      );
      const payload: UpdateJobRequest = {
        title: form.title,
        _function: form.jobFunction,
        jobType: form.jobType,
        location: form.location,
        applyMethod: form.applyMethod.trim(),
        description: descriptionForApi || undefined,
        responsibilities: form.responsibilities || undefined,
        qualifications: form.qualifications || undefined,
      };
      await updateJob.mutateAsync(payload);
      setIsSuccess(true);
      void router.push(backHref);
    } catch {
      setSaveError(translate('Error.FailedToSaveJob'));
    }
  }, [updateJob, form, translate, router, backHref]);

  if (isLoading) {
    return <LoadingState itemCount={3} />;
  }

  if (loadError) {
    return (
      <ErrorState
        title={translate('Error.UnableToLoadJob')}
        description={translate('Error.PleaseTryAgainShort')}
      />
    );
  }

  return (
    <>
      <Head>
        <title>
          {translate('Text.EditJobTitleSuffix', {
            title: job?.title ?? translate('Label.Jobs'),
          })}
        </title>
      </Head>
      <PageContent testId='talent-hub-v2-edit-job'>
        <div className='text-title-large'>{translate('Heading.EditJob')}</div>

        {saveError ? (
          <FeedbackBanner
            title=''
            description={saveError}
            layout='Inline'
            variant='Standard'
            severity='Error'
          />
        ) : null}
        {isSuccess ? (
          <FeedbackBanner
            title=''
            description={translate('Status.JobSavedSuccessfully')}
            layout='Inline'
            variant='Standard'
            severity='Success'
          />
        ) : null}

        <div className={styles.postJobFormFields}>
          <TextInput
            label={translate('Label.Position')}
            value={form.title}
            isRequired
            onChange={(e) => updateField('title', e.target.value)}
            placeholder='Software Engineer — [Your Game Name]'
          />

          <div className={styles.postJobFieldsGrid}>
            <div className={styles.postJobField}>
              <span className='text-label-large'>{translate('FunctionStar')}</span>
              <Dropdown
                className='width-full'
                size='Large'
                value={String(form.jobFunction)}
                placeholder={translate('Dropdown.SelectFunction')}
                onValueChange={(v) => {
                  const parsed = Number(v);
                  if (isJobFunctionValue(parsed)) {
                    updateField('jobFunction', parsed);
                  }
                }}>
                <Menu>
                  {jobFunctionOptions.map(([value, label]) => (
                    <MenuItem key={value} value={String(value)} title={label} />
                  ))}
                </Menu>
              </Dropdown>
            </div>
            <div className={styles.postJobField}>
              <span className='text-label-large'>{translate('JobTypeStar')}</span>
              <Dropdown
                className='width-full'
                size='Large'
                value={String(form.jobType)}
                placeholder={translate('Dropdown.SelectType')}
                onValueChange={(v) => {
                  const parsed = Number(v);
                  if (isJobTypeValue(parsed)) {
                    updateField('jobType', parsed);
                  }
                }}>
                <Menu>
                  {jobTypeOptions.map(([value, label]) => (
                    <MenuItem key={value} value={value} title={label} />
                  ))}
                </Menu>
              </Dropdown>
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
              <div className='margin-top-medium'>
                <TextInput
                  label={translate('Description.LocationFreeform')}
                  value={form.locationDetail}
                  onChange={(e) => updateField('locationDetail', e.target.value)}
                  placeholder='San Francisco, CA'
                />
              </div>
            </div>
          </div>

          <TextArea
            label={`${translate('Heading.AboutTheRole')} *`}
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder='[Your Studio] is hiring a Software Engineer to join the team behind [Your Game Name], one of the top experiences on Roblox. You will ship player-facing features, improve performance across client and server, and work closely with designers and artists to bring new ideas to life. This is a full-time, fully remote role open to candidates worldwide.'
            rows={6}
          />

          <TextArea
            label={`${translate('Heading.Responsibilities')} *`}
            value={form.responsibilities}
            onChange={(e) => updateField('responsibilities', e.target.value)}
            placeholder='Design, build, and maintain gameplay systems in Luau across client and server
Partner with designers, artists, and producers to scope and ship new features
Debug live issues, optimize performance, and raise the technical bar of the codebase
Mentor other engineers through code reviews and technical design discussions'
            rows={6}
          />

          <TextArea
            label={`${translate('Heading.Requirements')} *`}
            value={form.qualifications}
            onChange={(e) => updateField('qualifications', e.target.value)}
            placeholder='3+ years of professional software engineering experience, ideally shipping live games
Strong Luau or Lua skills and deep familiarity with Roblox Studio
Experience owning features end-to-end, from design doc through live release
Clear written communication and the ability to work independently in a remote team'
            rows={6}
          />

          <div className='gap-xxsmall flex flex-col'>
            <TextInput
              label={translate('Label.ExternalApplicationLink')}
              value={form.applyMethod}
              onChange={(e) => updateField('applyMethod', e.target.value)}
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
            variant='Emphasis'
            size='Medium'
            onClick={handleSave}
            isLoading={updateJob.isPending}
            isDisabled={applyMethodUrlInvalid}>
            {translate('Action.SaveChanges')}
          </Button>
          <Button variant='Standard' size='Medium' onClick={handleCancel}>
            {translate('Action.Cancel')}
          </Button>
        </div>
      </PageContent>
    </>
  );
};

export default EditJobContainer;
