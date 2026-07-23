import React, { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Button,
  Dropdown,
  FeedbackBanner,
  Menu,
  MenuItem,
  TextArea,
  TextInput,
} from '@rbx/foundation-ui';
import PageContent from '../components/shared/PageContent';
import { useJob } from '../hooks/useJobs';
import {
  useStudioOnboardingForm,
  jobFunctionOptions,
  jobTypeOptions,
  locationOptions,
} from '../hooks/useStudioOnboardingForm';
import { logPostJobPageView } from '../analytics';

export const StudioOnboardingV2Container: React.FC = () => {
  const router = useRouter();
  const studioIdParam =
    typeof router.query.studioId === 'string' ? router.query.studioId : undefined;
  const editJobId = typeof router.query.edit === 'string' ? router.query.edit : undefined;
  const isEditMode = Boolean(editJobId);
  const { data: existingJob, isLoading: isLoadingJob } = useJob(editJobId);

  useEffect(() => {
    if (studioIdParam) logPostJobPageView(studioIdParam);
  }, [studioIdParam]);

  const {
    formState,
    setField,
    errors,
    isValid,
    hasSubmitted,
    isSubmitting,
    isSuccess,
    submitError,
    handleSubmit,
  } = useStudioOnboardingForm({ existingJob: existingJob ?? null, isEditMode });

  return (
    <React.Fragment>
      <Head>
        <title>{isEditMode ? 'Edit job - Talent Hub' : 'Post a job - Talent Hub'}</title>
        <meta
          name='description'
          content={
            isEditMode
              ? 'Edit your job listing on Talent Hub.'
              : 'Post a new job listing on Talent Hub.'
          }
          key='description'
        />
        <meta
          property='og:title'
          content={`${isEditMode ? 'Edit job' : 'Post a job'} - Talent Hub`}
          key='og:title'
        />
        <meta
          property='og:description'
          content={
            isEditMode
              ? 'Edit your job listing on Talent Hub.'
              : 'Post a new job listing on Talent Hub.'
          }
          key='og:description'
        />
      </Head>
      <PageContent as='form' onSubmit={handleSubmit} testId='talent-hub-v2-onboarding'>
        {isEditMode && isLoadingJob ? (
          <div className='text-body-medium content-muted'>Loading job data…</div>
        ) : null}
        <div className='text-header-large'>{isEditMode ? 'Edit job' : 'Post a job'}</div>

        {isSuccess ? (
          <FeedbackBanner
            title=''
            description={
              isEditMode
                ? 'Your job listing has been updated successfully.'
                : 'Your job listing has been posted successfully.'
            }
            layout='Inline'
            variant='Standard'
            severity='Success'
          />
        ) : null}
        {submitError ? (
          <FeedbackBanner
            title=''
            description={submitError}
            layout='Inline'
            variant='Standard'
            severity='Error'
          />
        ) : null}

        <div className='flex flex-col gap-large'>
          <TextInput
            label='Position'
            value={formState.position}
            onChange={(event) => setField('position', event.target.value)}
            isRequired
            hasError={hasSubmitted && !!errors.position}
            error={hasSubmitted ? errors.position : ''}
            placeholder='Software engineer, designer, etc.'
          />
          <div className='flex flex-col gap-medium medium:flex-row'>
            <div className='fill'>
              <div className='text-label-medium padding-bottom-xxsmall'>Function *</div>
              <Dropdown
                className='width-full'
                size='Large'
                value={formState.jobFunction}
                placeholder='Select function'
                onValueChange={(value) => setField('jobFunction', value as string)}>
                <Menu>
                  {jobFunctionOptions
                    .filter((o) => o.value !== '')
                    .map((option) => (
                      <MenuItem key={option.value} value={option.value} title={option.label} />
                    ))}
                </Menu>
              </Dropdown>
              {hasSubmitted && errors.jobFunction ? (
                <div className='text-body-small content-muted'>{errors.jobFunction}</div>
              ) : null}
            </div>
            <div className='fill'>
              <div className='text-label-medium padding-bottom-xxsmall'>Job type *</div>
              <Dropdown
                className='width-full'
                size='Large'
                value={formState.jobType}
                placeholder='Select type'
                onValueChange={(value) => setField('jobType', value as string)}>
                <Menu>
                  {jobTypeOptions
                    .filter((o) => o.value !== '')
                    .map((option) => (
                      <MenuItem key={option.value} value={option.value} title={option.label} />
                    ))}
                </Menu>
              </Dropdown>
              {hasSubmitted && errors.jobType ? (
                <div className='text-body-small content-muted'>{errors.jobType}</div>
              ) : null}
            </div>
            <div className='fill'>
              <div className='text-label-medium padding-bottom-xxsmall'>Location *</div>
              <Dropdown
                className='width-full'
                size='Large'
                value={formState.location}
                placeholder='Select location'
                onValueChange={(value) => setField('location', value as string)}>
                <Menu>
                  {locationOptions
                    .filter((o) => o.value !== '')
                    .map((option) => (
                      <MenuItem key={option.value} value={option.value} title={option.label} />
                    ))}
                </Menu>
              </Dropdown>
              {hasSubmitted && errors.location ? (
                <div className='text-body-small content-muted'>{errors.location}</div>
              ) : null}
            </div>
          </div>
          <TextArea
            label='About the role'
            value={formState.aboutRole}
            onChange={(event) => setField('aboutRole', event.target.value)}
            hasError={hasSubmitted && !!errors.aboutRole}
            rows={6}
          />
          {hasSubmitted && errors.aboutRole ? (
            <div className='text-body-small content-muted'>{errors.aboutRole}</div>
          ) : null}
          <TextArea
            label='Responsibilities'
            value={formState.responsibilities}
            onChange={(event) => setField('responsibilities', event.target.value)}
            hasError={hasSubmitted && !!errors.responsibilities}
            rows={6}
          />
          {hasSubmitted && errors.responsibilities ? (
            <div className='text-body-small content-muted'>{errors.responsibilities}</div>
          ) : null}
          <TextArea
            label='Requirements'
            value={formState.requirements}
            onChange={(event) => setField('requirements', event.target.value)}
            hasError={hasSubmitted && !!errors.requirements}
            rows={6}
          />
          {hasSubmitted && errors.requirements ? (
            <div className='text-body-small content-muted'>{errors.requirements}</div>
          ) : null}
          <TextInput
            label='External application website'
            value={formState.applyMethod}
            onChange={(event) => setField('applyMethod', event.target.value)}
            hasError={hasSubmitted && !!errors.applyMethod}
            error={hasSubmitted ? errors.applyMethod : ''}
            helperText='Redirect creators to apply on your main application website'
          />
        </div>

        <div className='flex flex-col small:flex-row gap-small'>
          <Button
            type='submit'
            variant='Emphasis'
            size='Medium'
            isLoading={isSubmitting}
            isDisabled={!isValid}>
            {isEditMode ? 'Save changes' : 'Post'}
          </Button>
          <Button type='button' variant='Standard' size='Medium' onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </PageContent>
    </React.Fragment>
  );
};

export default StudioOnboardingV2Container;
