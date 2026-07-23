import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { Button, Icon } from '@rbx/foundation-ui';
import { Thumbnail2d, ThumbnailTypes, ReturnPolicy, UniverseThumbnailSize } from '@rbx/thumbnails';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import { Carousel } from '@modules/miscellaneous/common/components';
import { studiosApi } from '../api/talentHubClient';
import { LOGO_SIZE_LARGE } from '../constants';
import { useJobs } from '../hooks/useJobs';
import { useStudio } from '../hooks/useStudios';
import { toJobViewModel } from '../hooks/useJobViewModel';
import { toStudioViewModel } from '../hooks/useStudioViewModel';
import { useExperienceDetails } from '../hooks/useExperienceDetails';
import ErrorState from '../components/feedback/ErrorState';
import LoadingState from '../components/feedback/LoadingState';
import JobCard from '../components/jobs/JobCard';
import { StudioEditForm, type StudioFormState } from '../components/studios/StudioEditForm';
import PageContent from '../components/shared/PageContent';
import PlaceholderImage from '../components/shared/PlaceholderImage';
import { logJobCardClick, logStudioProfilePageView } from '../analytics';
import { detectPlatform, isMocksEnabled, isPermissionError } from '../utils';
import styles from '../components/shared/Layout.module.css';
import type { SocialPlatform } from '../utils';
import type { JobViewModel } from '../types';

function formatVisits(visits: number): string {
  if (visits >= 1_000_000) return `${(visits / 1_000_000).toFixed(1)}M+ Visits`;
  if (visits >= 1_000) return `${(visits / 1_000).toFixed(0)}K+ Visits`;
  return `${visits} Visits`;
}

type StudioProfileV2ContainerProps = {
  studioId: string;
  /** 'profile' hides the back-to-studios link and routes job detail back to /profile */
  context?: 'discover' | 'profile';
};

function parseSocialLinks(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeOptionalUrl(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function groupProfileHref(studio: { group?: string; groupId?: number }): string | undefined {
  if (!studio.group) return undefined;
  if (studio.group.startsWith('http')) return studio.group;
  if (studio.groupId != null) {
    return `https://www.roblox.com/communities/${studio.groupId}`;
  }
  return undefined;
}

const SocialIcon: React.FC<{ platform: SocialPlatform }> = ({ platform }) => {
  switch (platform) {
    case 'x':
      return (
        <svg
          width='18'
          height='18'
          viewBox='0 0 28 27'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'>
          <path
            d='M22.05 1H26.35L17.97 12.01L28 27H19.36L13.59 18.91L6.85 27H2.55L11.59 15.22L2 1H10.86L15.98 8.31L22.05 1ZM20.55 24.36H22.92L9.56 3.51H7.01L20.55 24.36Z'
            fill='currentColor'
          />
        </svg>
      );
    case 'youtube':
      return (
        <svg
          width='20'
          height='14'
          viewBox='0 0 20 14'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'>
          <path
            d='M19.58 2.19C19.36 1.35 18.7 0.69 17.87 0.47C16.35 0.07 10 0.07 10 0.07C10 0.07 3.65 0.07 2.13 0.47C1.3 0.69 0.64 1.35 0.42 2.19C0.02 3.71 0.02 7 0.02 7C0.02 7 0.02 10.29 0.42 11.81C0.64 12.65 1.3 13.31 2.13 13.53C3.65 13.93 10 13.93 10 13.93C10 13.93 16.35 13.93 17.87 13.53C18.7 13.31 19.36 12.65 19.58 11.81C19.98 10.29 19.98 7 19.98 7C19.98 7 19.98 3.71 19.58 2.19ZM7.99 10V4L13.19 7L7.99 10Z'
            fill='currentColor'
          />
        </svg>
      );
    case 'twitch':
      return (
        <svg
          width='18'
          height='18'
          viewBox='0 0 18 20'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'>
          <path
            d='M1.5 0L0 3.5V17.5H4.5V20H7L9.5 17.5H13L18 12.5V0H1.5ZM3.5 2H16V11.5L13.5 14H9.5L7 16.5V14H3.5V2ZM7.5 5.5V10.5H9.5V5.5H7.5ZM12 5.5V10.5H14V5.5H12Z'
            fill='currentColor'
          />
        </svg>
      );
    default:
      return (
        <svg
          width='16'
          height='16'
          viewBox='0 0 16 16'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'>
          <path
            d='M8 0C3.58 0 0 3.58 0 8C0 12.42 3.58 16 8 16C12.42 16 16 12.42 16 8C16 3.58 12.42 0 8 0ZM13.37 5H11.12C10.89 3.99 10.53 3.06 10.07 2.27C11.4 2.84 12.56 3.8 13.37 5ZM8 2C8.68 2.91 9.2 3.92 9.54 5H6.46C6.8 3.92 7.32 2.91 8 2ZM2.26 10C2.1 9.36 2 8.69 2 8C2 7.31 2.1 6.64 2.26 6H4.83C4.78 6.66 4.74 7.32 4.74 8C4.74 8.68 4.78 9.34 4.83 10H2.26ZM2.63 11H4.88C5.11 12.01 5.47 12.94 5.93 13.73C4.6 13.16 3.44 12.2 2.63 11ZM4.88 5H2.63C3.44 3.8 4.6 2.84 5.93 2.27C5.47 3.06 5.11 3.99 4.88 5ZM8 14C7.32 13.09 6.8 12.08 6.46 11H9.54C9.2 12.08 8.68 13.09 8 14ZM9.87 10H6.13C6.07 9.34 6.03 8.68 6.03 8C6.03 7.32 6.07 6.65 6.13 6H9.87C9.93 6.65 9.97 7.32 9.97 8C9.97 8.68 9.93 9.34 9.87 10ZM10.07 13.73C10.53 12.94 10.89 12.01 11.12 11H13.37C12.56 12.2 11.4 13.16 10.07 13.73ZM11.17 10C11.22 9.34 11.26 8.68 11.26 8C11.26 7.32 11.22 6.66 11.17 6H13.74C13.9 6.64 14 7.31 14 8C14 8.69 13.9 9.36 13.74 10H11.17Z'
            fill='currentColor'
          />
        </svg>
      );
  }
};

export const StudioProfileV2Container: React.FC<StudioProfileV2ContainerProps> = ({
  studioId,
  context = 'discover',
}) => {
  const queryClient = useQueryClient();
  const currentGroup = useCurrentGroup();
  const {
    data: studioData,
    isLoading: isStudioLoading,
    error: studioError,
    refetch,
  } = useStudio(studioId);
  const hasWrite = studioData?.permissions?.includes('write') === true;
  const canEditStudio = hasWrite;
  const canManageJobs = hasWrite;
  const studio = useMemo(
    () => (studioData ? toStudioViewModel(studioData) : undefined),
    [studioData],
  );

  useEffect(() => {
    if (studioId) logStudioProfilePageView(studioId);
  }, [studioId]);

  const {
    data: jobsData,
    isLoading: isJobsLoading,
    error: jobsError,
    refetch: refetchJobs,
  } = useJobs({
    studioId: [studioId],
  });
  const jobs = useMemo(() => (jobsData?.jobs ?? []).map(toJobViewModel), [jobsData]);

  const topUniverseIds = studio?.topExperienceUniverseIds ?? [];
  const { details: experiences, isLoading: isExperiencesLoading } =
    useExperienceDetails(topUniverseIds);

  const [isEditing, setIsEditing] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const getJobHref = useCallback(
    (job: JobViewModel) =>
      context === 'profile'
        ? `/hire/jobs/${job.id}?from=profile`
        : `/hire/jobs/${job.id}?from=studio&studioId=${studioId}`,
    [studioId, context],
  );

  const handleJobClick = useCallback((job: JobViewModel) => {
    logJobCardClick(job);
  }, []);

  const handleSaveProfile = useCallback(
    async (state: StudioFormState) => {
      if (!studioData) {
        setSaveError('Unable to save this studio right now.');
        return;
      }

      setIsSavingProfile(true);
      setSaveError(null);

      const rawStudio = studioData as typeof studioData & {
        groupId?: number | null;
      };

      const topExperienceUniverseIds = (rawStudio.topExperienceUniverseIds ?? []).filter(
        (id): id is number => typeof id === 'number',
      );

      const groupId = currentGroup?.id ?? rawStudio.groupId ?? null;
      if (groupId == null) {
        setSaveError('Select a studio group before updating this profile.');
        setIsSavingProfile(false);
        return;
      }

      try {
        await studiosApi.apiStudiosIdPut({
          id: studioId,
          updateStudioRequest: {
            name: state.name.trim(),
            logo: rawStudio.logo ?? null,
            email: state.email.trim(),
            description: state.description.trim(),
            teamSize: Number(rawStudio.teamSize ?? 0) as 0 | 1 | 2 | 3,
            website: normalizeOptionalUrl(state.website),
            socialLinks: parseSocialLinks(state.socialLinks),
            atsLink: normalizeOptionalUrl(state.atsLink),
            topExperienceUniverseIds,
          },
        });

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['talent-hub-v2', 'studios'] }),
          queryClient.invalidateQueries({ queryKey: ['talent-hub-v2', 'my-studios'] }),
        ]);

        setIsEditing(false);
      } catch (error) {
        if (isPermissionError(error)) {
          setSaveError("You don't have permission to update this studio.");
        } else {
          setSaveError(
            error instanceof Error ? error.message : 'Unable to save this studio right now.',
          );
        }
      } finally {
        setIsSavingProfile(false);
      }
    },
    [currentGroup?.id, queryClient, studioData, studioId],
  );

  const jobsContent = useMemo(() => {
    if (isJobsLoading) {
      return <LoadingState itemCount={3} />;
    }

    if (jobsError) {
      return (
        <ErrorState
          title='Unable to load jobs'
          description='Please try again in a moment.'
          actionLabel='Try again'
          onAction={() => refetchJobs()}
        />
      );
    }

    return (
      <div className={`flex flex-col radius-large ${styles.borderedCard} ${styles.dividedList}`}>
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            href={getJobHref(job)}
            onClick={handleJobClick}
            variant='card'
          />
        ))}
      </div>
    );
  }, [getJobHref, handleJobClick, isJobsLoading, jobs, jobsError, refetchJobs]);

  if (isStudioLoading) {
    return <LoadingState itemCount={4} />;
  }

  if (studioError || !studio) {
    return (
      <ErrorState
        title='Unable to load studio'
        description='Please try again in a moment.'
        actionLabel='Try again'
        onAction={() => refetch()}
      />
    );
  }

  const groupLinkHref = groupProfileHref(studio);

  return (
    <React.Fragment>
      <Head>
        <title>{`${studio.name} - Talent Hub`}</title>
        <meta
          name='description'
          content={studio.description ?? 'Studio profile on Talent Hub.'}
          key='description'
        />
        <meta property='og:title' content={`${studio.name} - Talent Hub`} key='og:title' />
        <meta
          property='og:description'
          content={studio.description ?? 'Studio profile on Talent Hub.'}
          key='og:description'
        />
      </Head>
      <PageContent testId='talent-hub-v2-studio-profile'>
        {canEditStudio && isEditing ? (
          <StudioEditForm
            studio={studio}
            onCancel={() => {
              setSaveError(null);
              setIsEditing(false);
            }}
            onSave={handleSaveProfile}
            isSaving={isSavingProfile}
            saveError={saveError}
          />
        ) : (
          <React.Fragment>
            {context === 'discover' && (
              <div className='margin-bottom-small self-start'>
                <Button as='a' href='/hire/studios' variant='Utility' size='Small'>
                  <span className='flex items-center gap-xxsmall'>
                    <Icon name='icon-regular-chevron-small-left' size='Small' />
                    <span>Back to studios</span>
                  </span>
                </Button>
              </div>
            )}
            <div className={styles.pageHeader}>
              <div className='flex items-center gap-small small:gap-large min-width-0'>
                {studio.logo ? (
                  <div
                    className='radius-medium bg-shift-200 clip shrink-0'
                    style={{ width: LOGO_SIZE_LARGE, height: LOGO_SIZE_LARGE }}>
                    <img
                      src={studio.logo}
                      alt={studio.name ?? ''}
                      className={`width-full height-full ${styles.objectCover}`}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <PlaceholderImage size={LOGO_SIZE_LARGE} className='radius-medium' />
                )}
                <div className='flex flex-col gap-xsmall min-width-0'>
                  <div className='text-heading-medium text-truncate-end'>{studio.name}</div>
                  <div className='flex items-center gap-xsmall min-width-0'>
                    {groupLinkHref ? (
                      <a
                        href={groupLinkHref}
                        target='_blank'
                        rel='noreferrer'
                        className='text-title-medium content-link text-truncate-end'>
                        {studio.name}
                      </a>
                    ) : (
                      <span className='text-title-medium content-muted text-truncate-end'>
                        {studio.name}
                      </span>
                    )}
                    <span className={styles.verifiedBadge}>
                      <Icon name='icon-filled-verified-mono' size='Small' />
                    </span>
                  </div>
                </div>
              </div>
              {canEditStudio && (
                <Button
                  variant='Standard'
                  size='Medium'
                  onClick={() => {
                    setSaveError(null);
                    setIsEditing(true);
                  }}>
                  Edit profile
                </Button>
              )}
            </div>

            <div className='flex flex-col gap-xlarge'>
              <div className='flex flex-col gap-small'>
                <div className='text-heading-small'>About</div>
                <div className='text-body-medium content-muted'>{studio.description}</div>
              </div>

              <div className='flex flex-col'>
                <div className={styles.sectionHeader}>
                  <span className='text-heading-small'>Information</span>
                </div>
                <div className={styles.infoRow}>
                  <span className='text-body-medium content-muted shrink-0'>Website</span>
                  <span className={`text-body-medium ${styles.infoRowValue}`}>
                    {studio.website ? (
                      <a
                        className='content-link'
                        href={studio.website}
                        target='_blank'
                        rel='noreferrer'>
                        {studio.website}
                      </a>
                    ) : (
                      '—'
                    )}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className='text-body-medium content-muted shrink-0'>Team size</span>
                  <span className={`text-body-medium ${styles.infoRowValue}`}>
                    {studio.teamSizeLabel}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className='text-body-medium content-muted shrink-0'>Location</span>
                  <span className={`text-body-medium ${styles.infoRowValue}`}>Remote</span>
                </div>
              </div>

              {topUniverseIds.length > 0 && (
                <div className='flex flex-col gap-small'>
                  <div className='text-heading-small'>Creations</div>
                  <div>
                    {isExperiencesLoading && (
                      <div className='flex gap-small clip'>
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className={`radius-large clip shrink-0 grow-0 ${styles.creationCard}`}>
                            <div
                              className={`bg-shift-200 width-full radius-large ${styles.aspectRatio16x9}`}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    {!isExperiencesLoading && experiences.length > 0 && (
                      <Carousel>
                        {experiences.map((exp) => (
                          <a
                            key={exp.url}
                            href={exp.url}
                            target='_blank'
                            rel='noreferrer'
                            className={`flex flex-col clip radius-large shrink-0 grow-0 ${styles.linkReset} ${styles.creationCard}`}>
                            {!isMocksEnabled() ? (
                              <div
                                className={`clip radius-large width-full ${styles.aspectRatio16x9}`}>
                                <Thumbnail2d
                                  targetId={exp.universeId}
                                  type={ThumbnailTypes.universeThumbnail}
                                  // eslint-disable-next-line no-underscore-dangle -- enum value from @rbx/thumbnails
                                  size={UniverseThumbnailSize._576x324}
                                  returnPolicy={ReturnPolicy.PlaceHolder}
                                  containerClass={styles.thumbnailFill}
                                  imgClassName={styles.thumbnailFillImg}
                                  alt={exp.name}
                                />
                              </div>
                            ) : (
                              <div className={`radius-large width-full ${styles.aspectRatio16x9}`}>
                                <PlaceholderImage landscape />
                              </div>
                            )}
                            <div className={`flex flex-col width-full ${styles.creationCaption}`}>
                              <div className='text-title-small'>{exp.name}</div>
                              {exp.visits != null ? (
                                <div className='text-body-small content-muted'>
                                  {formatVisits(exp.visits)}
                                </div>
                              ) : null}
                            </div>
                          </a>
                        ))}
                      </Carousel>
                    )}
                  </div>
                </div>
              )}

              <div className='flex flex-col gap-small'>
                <div className='flex padding-y-xsmall items-center justify-between'>
                  <span className='text-heading-small'>Jobs</span>
                  {canManageJobs && (
                    <Button
                      as='a'
                      href={`/hire/studios/onboard?studioId=${studioId}`}
                      variant='Emphasis'
                      size='Small'>
                      Post a job
                    </Button>
                  )}
                </div>
                {jobsContent}
              </div>

              <div className='flex flex-col gap-small'>
                <div className='padding-y-xxsmall'>
                  <span className='text-heading-small'>Social Media</span>
                </div>
                {(studio.socialLinks ?? []).length > 0 ? (
                  <div className={styles.socialGrid}>
                    {studio.socialLinks?.map((link) => {
                      const platform = detectPlatform(link);
                      return (
                        <a
                          key={link}
                          href={link}
                          target='_blank'
                          rel='noreferrer'
                          aria-label={`${platform} social link`}
                          className={styles.socialIconLink}>
                          <SocialIcon platform={platform} />
                        </a>
                      );
                    })}
                  </div>
                ) : (
                  <div className='text-body-medium content-muted'>—</div>
                )}
              </div>
            </div>
          </React.Fragment>
        )}
      </PageContent>
    </React.Fragment>
  );
};

export default StudioProfileV2Container;
