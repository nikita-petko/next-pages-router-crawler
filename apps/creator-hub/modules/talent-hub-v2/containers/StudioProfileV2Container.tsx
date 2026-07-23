import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Icon } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Thumbnail2d, ThumbnailTypes, ReturnPolicy, UniverseThumbnailSize } from '@rbx/thumbnails';
import Carousel from '@modules/miscellaneous/components/Carousel';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import { logJobCardClick, logStudioProfilePageView } from '../analytics';
import { studiosApi } from '../api/talentHubClient';
import { ErrorState } from '../components/feedback/ErrorState';
import { LoadingState } from '../components/feedback/LoadingState';
import { JobCard } from '../components/jobs/JobCard';
import PageContent from '../components/shared/PageContent';
import PlaceholderImage from '../components/shared/PlaceholderImage';
import StudioLogo from '../components/shared/StudioLogo';
import { VerifiedBadgeIcon } from '../components/shared/VerifiedBadgeIcon';
import { StudioEditForm } from '../components/studios/StudioEditForm';
import {
  toUpdateStudioRequest,
  type StudioFormState,
} from '../components/studios/StudioFormFields.types';
import { LOGO_SIZE_LARGE } from '../constants';
import { useExperienceDetails } from '../hooks/useExperienceDetails';
import { useJobs } from '../hooks/useJobs';
import { toJobViewModel } from '../hooks/useJobViewModel';
import { useStudio } from '../hooks/useStudios';
import { toStudioViewModel } from '../hooks/useStudioViewModel';
import { JobStatus, type JobViewModel, type UpdateStudioRequest } from '../types';
import { isMocksEnabled, isPermissionError, toRobloxCommunityAboutHref } from '../utils';
import styles from '../components/shared/Layout.module.css';

function formatVisits(visits: number): string {
  if (visits >= 1_000_000) {
    return `${(visits / 1_000_000).toFixed(1)}M+ Visits`;
  }
  if (visits >= 1_000) {
    return `${(visits / 1_000).toFixed(0)}K+ Visits`;
  }
  return `${visits} Visits`;
}

type StudioProfileV2ContainerProps = {
  studioId: string;
  /** 'profile' hides the back-to-studios link and routes job detail back to /profile */
  context?: 'discover' | 'profile';
};

function normalizeOptionalUrl(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export const StudioProfileV2Container: React.FC<StudioProfileV2ContainerProps> = ({
  studioId,
  context = 'discover',
}) => {
  const { translate } = useTranslation();
  const router = useRouter();
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
  const studioGroupHref = useMemo(
    () =>
      context === 'discover' && studio
        ? toRobloxCommunityAboutHref(studio.group, studio.groupId)
        : undefined,
    [context, studio],
  );

  useEffect(() => {
    if (studioId) {
      logStudioProfilePageView(studioId);
    }
  }, [studioId]);

  const {
    data: jobsData,
    isLoading: isJobsLoading,
    error: jobsError,
    refetch: refetchJobs,
  } = useJobs({
    studioId: [studioId],
    status: [JobStatus.NUMBER_0],
  });
  const jobs = useMemo(() => (jobsData?.jobs ?? []).map(toJobViewModel), [jobsData]);

  const topUniverseIds = studio?.topExperienceUniverseIds ?? [];
  const { details: experiences, isLoading: isExperiencesLoading } =
    useExperienceDetails(topUniverseIds);

  const [isEditing, setIsEditing] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fromQuery = typeof router.query.from === 'string' ? router.query.from : '';

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

  const backHref = useMemo(() => {
    if (context !== 'discover') {
      return null;
    }
    if (fromQuery === 'jobs') {
      return `/hire${qaParams ? `?${qaParams}` : ''}`;
    }
    return `/hire/studios${qaParams ? `?${qaParams}` : ''}`;
  }, [context, fromQuery, qaParams]);

  const backLabel = fromQuery === 'jobs' ? 'Back to jobs' : 'Back to studios';

  const handleBack = useCallback(() => {
    if (!backHref) {
      return;
    }
    void router.push(backHref);
  }, [backHref, router]);

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
        setSaveError(translate('Error.UnableToSaveStudio'));
        return;
      }

      setIsSavingProfile(true);
      setSaveError(null);

      const groupId = currentGroup?.id ?? studioData.groupId ?? null;
      if (groupId == null) {
        setSaveError(translate('Error.SelectStudioGroup'));
        setIsSavingProfile(false);
        return;
      }

      try {
        const base = toUpdateStudioRequest(state);
        const updateStudioRequest: UpdateStudioRequest = {
          ...base,
          logo: studioData.logo ?? null,
          socialLinks: studioData.socialLinks ?? null,
          atsLink: normalizeOptionalUrl(state.atsLink),
          atsJobSyncEnabled: studioData.atsJobSyncEnabled ?? null,
        };
        await studiosApi.apiStudiosIdPut({
          id: studioId,
          updateStudioRequest,
        });

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['talent-hub-v2', 'studios'] }),
          queryClient.invalidateQueries({
            queryKey: ['talent-hub-v2', 'studios', 'detail', studioId],
          }),
          queryClient.invalidateQueries({ queryKey: ['talent-hub-v2', 'my-studios'] }),
        ]);

        setIsEditing(false);
      } catch (error) {
        if (isPermissionError(error)) {
          setSaveError(translate('Error.NoPermissionUpdateStudio'));
        } else {
          setSaveError(translate('Error.UnableToSaveStudio'));
        }
      } finally {
        setIsSavingProfile(false);
      }
    },
    [currentGroup?.id, queryClient, studioData, studioId, translate],
  );
  const handleSaveProfileSync = useCallback(
    (state: StudioFormState) => {
      void handleSaveProfile(state);
    },
    [handleSaveProfile],
  );

  const jobsContent = useMemo(() => {
    if (isJobsLoading) {
      return <LoadingState itemCount={3} />;
    }

    if (jobsError) {
      return (
        <ErrorState
          title={translate('Error.UnableToLoadJobs')}
          description={translate('Error.PleaseTryAgain')}
          actionLabel={translate('Action.TryAgain')}
          onAction={() => {
            void refetchJobs();
          }}
        />
      );
    }

    return (
      <div className={`radius-large flex flex-col ${styles.borderedCard} ${styles.dividedList}`}>
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
  }, [getJobHref, handleJobClick, isJobsLoading, jobs, jobsError, refetchJobs, translate]);

  if (isStudioLoading) {
    return <LoadingState itemCount={4} />;
  }

  if (studioError || !studio) {
    return (
      <ErrorState
        title='Unable to load studio'
        description='Please try again in a moment.'
        actionLabel='Try again'
        onAction={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <>
      <Head>
        <title>{`${studio.name} - Talent Hub`}</title>
        <meta
          name='description'
          content={studio.description ?? translate('Description.StudioProfileOnTalentHub')}
          key='description'
        />
        <meta property='og:title' content={`${studio.name} - Talent Hub`} key='og:title' />
        <meta
          property='og:description'
          content={studio.description ?? translate('Description.StudioProfileOnTalentHub')}
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
            onSave={handleSaveProfileSync}
            isSaving={isSavingProfile}
            saveError={saveError}
          />
        ) : (
          <>
            {context === 'discover' && (
              <div className='self-start margin-bottom-small'>
                <Button variant='Utility' size='Small' onClick={handleBack}>
                  <span className='items-center gap-xxsmall flex'>
                    <Icon name='icon-regular-chevron-small-left' size='Small' />
                    <span>{backLabel}</span>
                  </span>
                </Button>
              </div>
            )}
            <div className={styles.pageHeader}>
              <div className='items-center min-width-0 gap-small flex small:gap-large'>
                <StudioLogo
                  logo={studio.logo}
                  groupId={studio.groupId}
                  size={LOGO_SIZE_LARGE}
                  alt={studio.name ?? ''}
                  className='radius-medium'
                />
                <div className='min-width-0 gap-xsmall flex flex-col'>
                  <div className='text-heading-medium text-truncate-end'>{studio.name}</div>
                  <div className='flex-wrap items-center gap-xsmall flex'>
                    {studioGroupHref ? (
                      <a
                        className='content-link text-body-large'
                        href={studioGroupHref}
                        target='_blank'
                        rel='noreferrer'>
                        {studio.name}
                      </a>
                    ) : (
                      <span className='content-default text-body-large'>{studio.name}</span>
                    )}
                    <VerifiedBadgeIcon size='medium' />
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
                  {translate('Action.EditProfile')}
                </Button>
              )}
            </div>

            <div className='gap-xlarge flex flex-col'>
              <div className='gap-small flex flex-col'>
                <div className='text-heading-small'>{translate('Heading.About')}</div>
                <div className='content-muted text-body-medium'>{studio.description}</div>
              </div>

              <div className='flex flex-col'>
                <div className={styles.sectionHeader}>
                  <span className='text-heading-small'>{translate('Heading.Information')}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className='content-muted text-body-medium shrink-0'>
                    {translate('Label.Website')}
                  </span>
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
                  <span className='content-muted text-body-medium shrink-0'>
                    {translate('Label.TeamSize')}
                  </span>
                  <span className={`text-body-medium ${styles.infoRowValue}`}>
                    {studio.teamSizeLabel}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className='content-muted text-body-medium shrink-0'>
                    {translate('Label.Location')}
                  </span>
                  <span className={`text-body-medium ${styles.infoRowValue}`}>
                    {studio.location ?? '—'}
                  </span>
                </div>
              </div>

              {topUniverseIds.length > 0 && (
                <div className='gap-medium flex flex-col'>
                  <div className='text-heading-small'>{translate('Heading.Creations')}</div>
                  <div>
                    {isExperiencesLoading && (
                      <div className='gap-small flex clip'>
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className={`radius-large clip grow-0 shrink-0 ${styles.creationCard}`}>
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
                            className={`radius-large flex clip flex-col grow-0 shrink-0 ${styles.linkReset} ${styles.creationCard}`}>
                            {!isMocksEnabled() ? (
                              <div
                                className={`width-full radius-large clip ${styles.aspectRatio16x9}`}>
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
                              <div className={`width-full radius-large ${styles.aspectRatio16x9}`}>
                                <PlaceholderImage landscape />
                              </div>
                            )}
                            <div className={`width-full flex flex-col ${styles.creationCaption}`}>
                              <div className='text-title-small'>{exp.name}</div>
                              {exp.visits != null ? (
                                <div className='content-muted text-body-small'>
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

              <div className='gap-small flex flex-col'>
                <div className='items-center justify-between padding-y-xsmall flex'>
                  <span className='text-heading-small'>{translate('Heading.Jobs')}</span>
                  {canManageJobs && (
                    <Button as='a' href='/hire/my-studio/post-job' variant='Emphasis' size='Medium'>
                      {translate('Action.PostAJob')}
                    </Button>
                  )}
                </div>
                {jobsContent}
              </div>
            </div>
          </>
        )}
      </PageContent>
    </>
  );
};

export default StudioProfileV2Container;
