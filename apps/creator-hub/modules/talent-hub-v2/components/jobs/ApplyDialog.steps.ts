import type {
  ApiTalentProfile,
  ApiTalentProfileCreateRequest,
  ApiTalentProfileUpdateRequest,
  JobViewModel,
} from '../../types';

export type ApplyDialogProps = {
  open: boolean;
  job: JobViewModel;
  profile: ApiTalentProfile | null;
  isCreatingProfile: boolean;
  isUpdatingProfile: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onCreateProfile: (payload: ApiTalentProfileCreateRequest) => Promise<ApiTalentProfile>;
  onUpdateProfile: (payload: ApiTalentProfileUpdateRequest) => Promise<ApiTalentProfile>;
  onSubmitApplication: (args: {
    resumeId?: string;
    includeSignals: boolean;
    profileId?: string;
  }) => Promise<void>;
};

export type Step =
  | 'create-profile'
  | 'profile-preview'
  | 'edit-profile'
  | 'resume-stats'
  | 'review';

export const STEP_SLOT: Record<Step, number> = {
  'create-profile': 0,
  'profile-preview': 0,
  'edit-profile': 0,
  'resume-stats': 1,
  review: 2,
};
export const TOTAL_SLOTS = 3;

export function stepProgress(step: Step): number {
  const idx = STEP_SLOT[step];
  return Math.round(((idx + 1) / TOTAL_SLOTS) * 100);
}
