import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useState } from 'react';
import { Button, Snackbar } from '@rbx/foundation-ui';
import { useAuthentication } from '@modules/authentication/providers';
import {
  logTalentProfileSave,
  logTalentProfilePageView,
  logTalentProfileCreate,
} from '../analytics';
import { LoadingState } from '../components/feedback/LoadingState';
import ProfileForm from '../components/profile/ProfileForm';
import ProfileReadView from '../components/profile/ProfileReadView';
import PageContent from '../components/shared/PageContent';
import useAgeVerification from '../hooks/useAgeVerification';
import {
  useMyTalentProfile,
  useCreateTalentProfile,
  useUpdateTalentProfile,
} from '../hooks/useTalentProfile';
import { useTalentProfileViewModel } from '../hooks/useTalentProfileViewModel';
import type { ApiTalentProfileCreateRequest, ApiTalentProfileUpdateRequest } from '../types';
import { isPermissionError } from '../utils';
import styles from '../components/shared/Layout.module.css';

const VERIFY_AGE_HREF = 'https://www.roblox.com/my/account#!/info';

const TalentProfileEmptyIllustration: React.FC = () => (
  <svg
    width='320'
    height='180'
    viewBox='0 0 320 180'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    aria-hidden>
    <path
      opacity='0.16'
      d='M216.986 124.942L217.374 126.39L128.509 150.202L128.121 148.753L216.986 124.942ZM218.754 121.88L194.943 33.0146C194.608 31.7643 193.382 30.9904 192.131 31.1928L191.881 31.2468L103.016 55.0581C101.765 55.3931 100.991 56.6188 101.194 57.8696L101.248 58.12L125.059 146.985C125.417 148.319 126.787 149.11 128.121 148.753L128.509 150.202L128.309 150.25C126.307 150.68 124.298 149.52 123.668 147.571L123.61 147.373L99.7989 58.5082C99.2272 56.3744 100.494 54.181 102.627 53.6093L191.493 29.7979L191.693 29.7493C193.762 29.3059 195.838 30.5592 196.392 32.6263L220.203 121.492L220.251 121.692C220.681 123.694 219.521 125.703 217.572 126.332L217.374 126.39L216.986 124.942C218.32 124.584 219.111 123.213 218.754 121.88Z'
      fill='#F7F7F8'
    />
    <path
      d='M169.621 88.5001C174.56 88.5003 178.832 91.9431 179.881 96.7696L183.776 114.686C183.974 115.595 183.849 116.778 182.939 117.633C180.968 119.485 175.224 123 160 123C144.776 123 139.031 119.485 137.06 117.633C136.15 116.778 136.026 115.595 136.223 114.686L140.118 96.7696C141.167 91.9429 145.439 88.5001 150.379 88.5001H169.621ZM150.379 91.5001C146.85 91.5001 143.799 93.9597 143.049 97.4073L139.155 115.322C139.139 115.395 139.141 115.446 139.144 115.473C140.39 116.625 145.294 120 160 120C174.705 120 179.608 116.625 180.854 115.473C180.857 115.446 180.86 115.395 180.844 115.322L176.95 97.4073C176.2 93.9598 173.149 91.5003 169.621 91.5001H150.379ZM150.357 59.7775C151.037 57.2395 153.646 55.7334 156.184 56.4132L169.972 60.1075C172.51 60.7879 174.016 63.3969 173.337 65.9347L169.642 79.7228L169.573 79.9571C168.824 82.2752 166.434 83.6551 164.052 83.1446L163.815 83.087L150.027 79.3927C147.568 78.7337 146.077 76.2641 146.605 73.8028L146.663 73.5655L150.357 59.7775ZM155.408 59.3116C154.47 59.0605 153.507 59.6164 153.255 60.5538L149.561 74.3419C149.31 75.2795 149.866 76.2428 150.803 76.4943L164.591 80.1886C165.529 80.4394 166.492 79.8836 166.744 78.9464L170.438 65.1583C170.689 64.2209 170.133 63.2577 169.196 63.006L155.408 59.3116Z'
      fill='#F7F7F8'
    />
  </svg>
);

/**
 * The legacy signature accepted a `profileId` string. The backend has no
 * concept of a profile id distinct from the user id — every write is auth-
 * derived, and reads are keyed by Roblox user id. We keep the prop for
 * backwards-compatibility with the route (`/hire/profile/[profileId]`) but
 * only resolve the "me" case today; recruiter views of other users'
 * profiles come in via a separate route once that flow lands.
 */
type TalentProfileV2ContainerProps = {
  profileId?: string;
};

export const TalentProfileV2Container: React.FC<TalentProfileV2ContainerProps> = () => {
  const router = useRouter();
  const forceEdit = router.query.edit === '1';
  const { user } = useAuthentication();
  const isAuthenticated = Boolean(user);
  const { isVerified, isLoading: isAgeVerificationLoading } = useAgeVerification(isAuthenticated);
  const {
    data: myProfile,
    isFetching: isMyProfileFetching,
    error: myProfileError,
  } = useMyTalentProfile();
  const profileViewModel = useTalentProfileViewModel(myProfile ?? undefined);

  useEffect(() => {
    logTalentProfilePageView();
  }, []);

  const createProfile = useCreateTalentProfile();
  const updateProfile = useUpdateTalentProfile(myProfile?.userId);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isEditing, setIsEditing] = useState(forceEdit);
  // Successful save/create fires a transient Snackbar (Figma spec) instead
  // of an inline success FeedbackBanner.
  const [successSnackbar, setSuccessSnackbar] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleCreate = useCallback(
    async (payload: ApiTalentProfileCreateRequest | ApiTalentProfileUpdateRequest) => {
      setSuccessSnackbar(null);
      setSaveError(null);
      try {
        await createProfile.mutateAsync(payload as ApiTalentProfileCreateRequest);
        logTalentProfileCreate();
        setSuccessSnackbar('Profile created');
      } catch {
        setSaveError('Failed to create profile. Please try again.');
      }
    },
    [createProfile],
  );

  const handleSave = useCallback(
    async (payload: ApiTalentProfileCreateRequest | ApiTalentProfileUpdateRequest) => {
      setSuccessSnackbar(null);
      setSaveError(null);
      try {
        const result = await updateProfile.mutateAsync(payload as ApiTalentProfileUpdateRequest);
        logTalentProfileSave(result);
        setSuccessSnackbar('Profile saved');
        setIsEditing(false);
      } catch (err) {
        let message = 'Failed to save profile. Please try again.';
        if (isPermissionError(err)) {
          message = 'You don\u2019t have permission to edit this profile.';
        }
        setSaveError(message);
      }
    },
    [updateProfile],
  );

  const handleEdit = useCallback(() => setIsEditing(true), []);

  const handleCancel = useCallback(() => {
    setSuccessSnackbar(null);
    setSaveError(null);
    setIsEditing(false);
  }, []);

  useEffect(() => {
    if (forceEdit && myProfile) {
      setIsEditing(true);
    }
  }, [forceEdit, myProfile]);

  if (isMyProfileFetching) {
    return <LoadingState itemCount={3} />;
  }

  const isProfileAccessDenied = isPermissionError(myProfileError);
  const canCreateProfile = isAuthenticated && isVerified && !isProfileAccessDenied;
  const shouldShowVerifyAgeAction =
    isAuthenticated && !isAgeVerificationLoading && !isVerified && !isProfileAccessDenied;

  const head = (
    <Head>
      <title>Talent Profile - Talent Hub</title>
      <meta name='description' content='Create and update your talent profile.' key='description' />
      <meta property='og:title' content='Talent Profile - Talent Hub' key='og:title' />
      <meta
        property='og:description'
        content='Create and update your talent profile.'
        key='og:description'
      />
    </Head>
  );

  if (!profileViewModel) {
    if (!showCreateForm || !canCreateProfile) {
      return (
        <>
          {head}
          <PageContent testId='talent-hub-v2-profile-prompt'>
            <div className={styles.appliedEmptyState}>
              <TalentProfileEmptyIllustration />
              <div className='text-align-center text-heading-medium'>
                Create your talent profile
              </div>
              <div
                className={`text-align-center content-muted text-body-medium ${styles.appliedEmptyText}`}>
                Build your profile to showcase your skills, experience, and game development
                projects. A complete profile helps studios discover your talent and increases your
                chances of landing your dream job.
              </div>
              <div className='items-center justify-center gap-small flex'>
                <Button
                  variant='Emphasis'
                  size='Medium'
                  onClick={() => setShowCreateForm(true)}
                  isDisabled={!canCreateProfile}>
                  Create profile
                </Button>
                {shouldShowVerifyAgeAction ? (
                  <Button
                    as='a'
                    href={VERIFY_AGE_HREF}
                    target='_blank'
                    rel='noreferrer'
                    variant='Standard'
                    size='Medium'>
                    Verify age
                  </Button>
                ) : null}
              </div>
            </div>
          </PageContent>
        </>
      );
    }

    return (
      <>
        {head}
        <PageContent testId='talent-hub-v2-profile-create'>
          <ProfileForm
            mode='create'
            isSaving={createProfile.isPending}
            onSubmit={handleCreate}
            onCancel={() => setShowCreateForm(false)}
            submitError={saveError}
          />
        </PageContent>
        {successSnackbar ? (
          <Snackbar
            title={successSnackbar}
            shouldAutoDismiss
            onClose={() => setSuccessSnackbar(null)}
          />
        ) : null}
      </>
    );
  }

  return (
    <>
      {head}
      <PageContent testId='talent-hub-v2-profile'>
        {!isEditing ? (
          <ProfileReadView profile={profileViewModel} onEdit={handleEdit} />
        ) : (
          <ProfileForm
            key={myProfile?.updatedAt?.toISOString() ?? String(myProfile?.userId ?? '')}
            mode='edit'
            initialProfile={myProfile ?? undefined}
            isSaving={updateProfile.isPending}
            onSubmit={handleSave}
            onCancel={handleCancel}
            submitError={saveError}
          />
        )}
      </PageContent>
      {successSnackbar ? (
        <Snackbar
          title={successSnackbar}
          shouldAutoDismiss
          onClose={() => setSuccessSnackbar(null)}
        />
      ) : null}
    </>
  );
};

export default TalentProfileV2Container;
