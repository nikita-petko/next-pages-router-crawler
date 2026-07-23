import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import type {
  JobsListJobsRequest,
  ApplicantRowViewModel,
  JobViewModel,
  StudioViewModel,
} from './types';

export function logJobCardClick(job: JobViewModel) {
  unifiedLoggerClient.logClickEvent({
    eventName: CreatorDashboardEventType.TalentHubV2JobCardClick,
    parameters: {
      jobId: job.id,
      studioId: job.studioId,
    },
  });
}

export function logFilterChange(filters: JobsListJobsRequest) {
  unifiedLoggerClient.logClickEvent({
    eventName: CreatorDashboardEventType.TalentHubV2FilterChange,
    parameters: {
      // eslint-disable-next-line no-underscore-dangle -- generated API field uses underscore prefix
      function: (filters._function ?? []).join(','),
      type: String(filters.type ?? ''),
      location: (filters.location ?? []).join(','),
      studioId: (filters.studioId ?? []).join(','),
      status: String(filters.status ?? ''),
    },
  });
}

export function logApplyClick(job: JobViewModel) {
  unifiedLoggerClient.logClickEvent({
    eventName: CreatorDashboardEventType.TalentHubV2ApplyClick,
    parameters: {
      jobId: job.id,
      studioId: job.studioId,
    },
  });
}

export function logStudioCardClick(studio: StudioViewModel) {
  unifiedLoggerClient.logClickEvent({
    eventName: CreatorDashboardEventType.TalentHubV2StudioCardClick,
    parameters: {
      studioId: studio.id,
    },
  });
}

export function logTalentProfileSave(profile: { userId?: number }) {
  unifiedLoggerClient.logClickEvent({
    eventName: CreatorDashboardEventType.TalentHubV2ProfileSave,
    parameters: {
      userId: profile.userId != null ? String(profile.userId) : '',
    },
  });
}

export function logInboxRowClick(item: ApplicantRowViewModel) {
  unifiedLoggerClient.logClickEvent({
    eventName: CreatorDashboardEventType.TalentHubV2InboxRowClick,
    parameters: {
      applicationId: item.id,
      studioName: item.studioName,
    },
  });
}

// ── Page views ──────────────────────────────────────────────────────

export function logJobsPageView() {
  unifiedLoggerClient.logImpressionEvent({
    eventName: CreatorDashboardEventType.TalentHubV2JobsPageView,
  });
}

export function logStudiosPageView() {
  unifiedLoggerClient.logImpressionEvent({
    eventName: CreatorDashboardEventType.TalentHubV2StudiosPageView,
  });
}

export function logStudioProfilePageView(studioId: string) {
  unifiedLoggerClient.logImpressionEvent({
    eventName: CreatorDashboardEventType.TalentHubV2StudioProfilePageView,
    parameters: { studioId },
  });
}

export function logTalentProfilePageView() {
  unifiedLoggerClient.logImpressionEvent({
    eventName: CreatorDashboardEventType.TalentHubV2TalentProfilePageView,
  });
}

export function logInboxPageView() {
  unifiedLoggerClient.logImpressionEvent({
    eventName: CreatorDashboardEventType.TalentHubV2InboxPageView,
  });
}

export function logPostJobPageView(studioId: string) {
  unifiedLoggerClient.logImpressionEvent({
    eventName: CreatorDashboardEventType.TalentHubV2PostJobPageView,
    parameters: { studioId },
  });
}

// ── Job submit actions ──────────────────────────────────────────────

export function logJobPostSubmit(studioId: string) {
  unifiedLoggerClient.logClickEvent({
    eventName: CreatorDashboardEventType.TalentHubV2JobPostSubmit,
    parameters: { studioId },
  });
}

export function logJobEditSubmit(jobId: string, studioId: string) {
  unifiedLoggerClient.logClickEvent({
    eventName: CreatorDashboardEventType.TalentHubV2JobEditSubmit,
    parameters: { jobId, studioId },
  });
}

export function logApplicationSubmit(jobId: string, profileId: string) {
  unifiedLoggerClient.logClickEvent({
    eventName: CreatorDashboardEventType.TalentHubV2ApplicationSubmit,
    parameters: { jobId, profileId },
  });
}

export function logTalentProfileCreate() {
  unifiedLoggerClient.logClickEvent({
    eventName: CreatorDashboardEventType.TalentHubV2ProfileCreate,
  });
}

export function logApplicantStatusChange(applicantId: string, interested: boolean) {
  unifiedLoggerClient.logClickEvent({
    eventName: CreatorDashboardEventType.TalentHubV2ApplicantStatusChange,
    parameters: { applicantId, interested: String(interested) },
  });
}

export function logJobClose(jobId: string) {
  unifiedLoggerClient.logClickEvent({
    eventName: CreatorDashboardEventType.TalentHubV2JobClose,
    parameters: { jobId },
  });
}

export function logCreateStudioSubmit() {
  unifiedLoggerClient.logClickEvent({
    eventName: CreatorDashboardEventType.TalentHubV2CreateStudioSubmit,
  });
}

export function logCreateStudioSuccess(studioId: number) {
  unifiedLoggerClient.logClickEvent({
    eventName: CreatorDashboardEventType.TalentHubV2CreateStudioSuccess,
    parameters: { studioId: String(studioId) },
  });
}

export function logCreateStudioError(httpStatus?: number) {
  unifiedLoggerClient.logClickEvent({
    eventName: CreatorDashboardEventType.TalentHubV2CreateStudioError,
    ...(httpStatus !== undefined ? { parameters: { httpStatus: String(httpStatus) } } : {}),
  });
}

export function logInteractionClick(parameters: {
  action: string;
  elementType: string;
  route: string;
  testId?: string;
}) {
  unifiedLoggerClient.logClickEvent({
    eventName: CreatorDashboardEventType.TalentHubV2InteractionClick,
    parameters,
  });
}
