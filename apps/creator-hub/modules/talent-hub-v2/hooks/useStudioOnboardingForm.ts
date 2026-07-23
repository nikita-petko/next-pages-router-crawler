import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { jobsApi } from '../api/talentHubClient';
import { API_JOB_FUNCTION_LABELS } from '../constants';
import type { Job, JobFunction, JobType } from '../types';
import { isPermissionError } from '../utils';
import { logJobPostSubmit, logJobEditSubmit } from '../analytics';
import { useMyStudios } from './useMyStudios';

export type OnboardingFormState = {
  position: string;
  jobFunction: string;
  jobType: string;
  location: string;
  aboutRole: string;
  responsibilities: string;
  requirements: string;
  applyMethod: string;
};

const defaultState: OnboardingFormState = {
  position: '',
  jobFunction: '0',
  jobType: '',
  location: '',
  aboutRole: '',
  responsibilities: '',
  requirements: '',
  applyMethod: '',
};

const JOB_TYPE_API_TO_FORM: Record<number, string> = {
  0: 'FullTime',
  1: 'PartTime',
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved for M2 location mapping
const LOCATION_TYPE_API_TO_FORM: Record<number, string> = {
  0: 'Remote',
  1: 'Onsite',
  2: 'Hybrid',
};

const JOB_FUNCTION_VALUES = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;

export const jobTypeOptions = [
  { value: '', label: 'Select type' },
  { value: 'FullTime', label: 'Full-time' },
  { value: 'PartTime', label: 'Part-time' },
];

export const locationOptions = [
  { value: '', label: 'Select location' },
  { value: 'Remote', label: 'Remote' },
  { value: 'Onsite', label: 'Onsite' },
  { value: 'Hybrid', label: 'Hybrid' },
];

export const jobFunctionOptions = [
  { value: '', label: 'Select function' },
  ...JOB_FUNCTION_VALUES.map((value) => ({
    value: String(value),
    label: API_JOB_FUNCTION_LABELS[value],
  })),
];

function normalizeJobFunction(jobFunction: number | null | undefined): string {
  if (jobFunction == null) {
    return '';
  }

  return String(jobFunction >= 8 ? 8 : jobFunction);
}

function getJobFunction(job: Job): number | undefined {
  const value = Reflect.get(job as object, '_function');
  return typeof value === 'number' ? value : undefined;
}

type UseStudioOnboardingFormOptions = {
  existingJob?: Job | null;
  isEditMode: boolean;
};

export function useStudioOnboardingForm({
  existingJob,
  isEditMode,
}: UseStudioOnboardingFormOptions) {
  const queryClient = useQueryClient();
  const { data: myStudiosData } = useMyStudios();
  const [formState, setFormState] = useState<OnboardingFormState>(defaultState);
  const [hasPopulated, setHasPopulated] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode && existingJob && !hasPopulated) {
      setFormState({
        position: existingJob.title ?? '',
        jobFunction: normalizeJobFunction(getJobFunction(existingJob)),
        jobType: JOB_TYPE_API_TO_FORM[existingJob.jobType as number] ?? '',
        location: existingJob.location ?? '',
        aboutRole: existingJob.description ?? '',
        responsibilities: existingJob.responsibilities ?? '',
        requirements: existingJob.qualifications ?? '',
        applyMethod: existingJob.applyMethod ?? '',
      });
      setHasPopulated(true);
    }
  }, [isEditMode, existingJob, hasPopulated]);

  const setField = useCallback((field: keyof OnboardingFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  }, []);

  const errors = useMemo(
    () => ({
      position: formState.position ? '' : 'Position is required.',
      jobFunction: '',
      jobType: formState.jobType ? '' : 'Job type is required.',
      location: formState.location ? '' : 'Location is required.',
      aboutRole: formState.aboutRole ? '' : 'About the role is required.',
      responsibilities: formState.responsibilities ? '' : 'Responsibilities are required.',
      requirements: formState.requirements ? '' : 'Requirements are required.',
      applyMethod: formState.applyMethod.trim() ? '' : 'An application URL or email is required.',
    }),
    [formState],
  );

  const isValid = useMemo(() => Object.values(errors).every((value) => value === ''), [errors]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setHasSubmitted(true);
      setSubmitError(null);
      if (!isValid) return;

      const studioId = existingJob?.studioId ?? myStudiosData?.studios?.[0]?.id;
      if (!studioId) {
        setSubmitError('You need a studio profile before posting a job.');
        return;
      }

      setIsSubmitting(true);
      setIsSuccess(false);

      try {
        const payload = {
          studioId,
          title: formState.position.trim(),
          _function: Number(formState.jobFunction) as JobFunction,
          jobType: (formState.jobType === 'PartTime' ? 1 : 0) as JobType,
          location: formState.location.trim(),
          applyMethod: formState.applyMethod.trim(),
          description: formState.aboutRole.trim(),
          responsibilities: formState.responsibilities.trim(),
          qualifications: formState.requirements.trim(),
        };

        if (isEditMode && existingJob?.id) {
          await jobsApi.apiJobsIdPut({ id: existingJob.id, updateJobRequest: payload });
          logJobEditSubmit(existingJob.id, studioId);
        } else {
          await jobsApi.apiJobsPost({ createJobRequest: payload });
          logJobPostSubmit(studioId);
        }

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['talent-hub-v2', 'jobs'] }),
          queryClient.invalidateQueries({ queryKey: ['talent-hub-v2', 'studios'] }),
          queryClient.invalidateQueries({ queryKey: ['talent-hub-v2', 'my-studios'] }),
        ]);
        setIsSuccess(true);
      } catch (error) {
        if (isPermissionError(error)) {
          setSubmitError("You don't have permission to manage jobs for this studio.");
        } else {
          setSubmitError(
            error instanceof Error ? error.message : 'Unable to save this job right now.',
          );
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      existingJob,
      formState.aboutRole,
      formState.applyMethod,
      formState.jobFunction,
      formState.jobType,
      formState.location,
      formState.position,
      formState.requirements,
      formState.responsibilities,
      isEditMode,
      isValid,
      myStudiosData?.studios,
      queryClient,
    ],
  );

  return {
    formState,
    setField,
    errors,
    isValid,
    hasSubmitted,
    isSubmitting,
    isSuccess,
    submitError,
    handleSubmit,
  };
}
