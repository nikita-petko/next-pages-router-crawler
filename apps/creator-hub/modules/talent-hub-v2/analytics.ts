import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import type {
  JobsListJobsRequest,
  ApplicationViewModel,
  JobViewModel,
  StudioViewModel,
  TalentProfileViewModel,
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

export function logTalentProfileSave(profile: TalentProfileViewModel) {
  unifiedLoggerClient.logClickEvent({
    eventName: CreatorDashboardEventType.TalentHubV2ProfileSave,
    parameters: {
      profileId: profile.id,
      userId: profile.userId,
    },
  });
}

export function logInboxRowClick(item: ApplicationViewModel) {
  unifiedLoggerClient.logClickEvent({
    eventName: CreatorDashboardEventType.TalentHubV2InboxRowClick,
    parameters: {
      applicationId: item.id,
      jobId: item.jobId,
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
