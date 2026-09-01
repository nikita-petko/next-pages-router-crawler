import React, { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { useRouter } from 'next/router';
import { Button, Snackbar } from '@rbx/foundation-ui';
import Authenticated from '@modules/authentication/Authenticated';
import { LoadingState } from '@modules/talent-hub-v2/components/feedback/LoadingState';
import { StudioOnboardingEmptyState } from '@modules/talent-hub-v2/components/profile/StudioOnboardingEmptyState';
import PageContent from '@modules/talent-hub-v2/components/shared/PageContent';
import { TalentHubLayout } from '@modules/talent-hub-v2/components/shared/TalentHubLayout';
import { STUDIO_ONBOARDING_SURVEY_URL } from '@modules/talent-hub-v2/constants';
import { StudioProfileV2Container } from '@modules/talent-hub-v2/containers/StudioProfileV2Container';
import TalentHubM2Guard from '@modules/talent-hub-v2/guards/TalentHubM2Guard';
import { useIsM2Enabled } from '@modules/talent-hub-v2/hooks/useIsM2Enabled';
import { useMyStudios } from '@modules/talent-hub-v2/hooks/useMyStudios';
import styles from '@modules/talent-hub-v2/components/shared/Layout.module.css';

const StudioOnboardingIllustration: React.FC = () => (
  <div className={styles.studioEmptyIllustrationWrap} aria-hidden>
    <span className={styles.studioEmptyIllustrationFrame}>
      <svg
        width='121'
        height='121'
        viewBox='0 0 121 121'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'>
        <path
          opacity='0.16'
          d='M117.324 95.2814L117.712 96.7303L28.8472 120.542L28.4589 119.093L117.324 95.2814ZM119.092 92.2196L95.2805 3.3544C94.9455 2.10417 93.7198 1.3302 92.4691 1.53268L92.2187 1.58664L3.35349 25.398C2.10326 25.733 1.32928 26.9587 1.53177 28.2094L1.58573 28.4598L25.3971 117.325C25.7544 118.659 27.1253 119.45 28.4589 119.093L28.8472 120.542L28.6469 120.59C26.6446 121.019 24.6358 119.86 24.0062 117.911L23.9482 117.713L0.136839 28.8481C-0.434928 26.7142 0.831402 24.5209 2.96527 23.9491L91.8304 0.137748L92.0307 0.0891335C94.0999 -0.354262 96.1755 0.899064 96.7294 2.96617L120.541 91.8313L120.589 92.0316C121.018 94.0339 119.859 96.0427 117.91 96.6723L117.712 96.7303L117.324 95.2814C118.658 94.9241 119.449 93.5532 119.092 92.2196Z'
          fill='#F7F7F8'
        />
      </svg>
    </span>
    <svg
      width='72'
      height='72'
      viewBox='0 0 72 72'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className={styles.studioEmptyIllustrationIcon}>
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M37.9309 36.75C43.0235 36.75 47.3721 40.4135 48.5032 45.4834L50.9172 56.3018C51.1892 57.5212 50.7964 59.044 49.4172 59.7666C47.5266 60.7571 43.4377 62.25 36.0002 62.25C28.5627 62.25 24.4738 60.7571 22.5832 59.7666C21.2043 59.044 20.8113 57.5211 21.0832 56.3018L23.4973 45.4834C24.6283 40.4135 28.977 36.7501 34.0696 36.75H37.9309ZM34.0696 39.75C30.469 39.7501 27.2694 42.3518 26.425 46.1367L24.0119 56.9551C23.9937 57.0369 24.0023 57.0953 24.01 57.125C25.4316 57.8622 29.0268 59.25 36.0002 59.25C42.9722 59.25 46.5672 57.8623 47.9895 57.125C47.9972 57.0954 48.0068 57.0372 47.9885 56.9551L45.5754 46.1367C44.731 42.3517 41.5316 39.75 37.9309 39.75H34.0696ZM18.3235 27.75C20.6794 27.75 22.8197 28.8048 24.3547 30.4902C24.9123 31.1027 24.8675 32.0516 24.2551 32.6094C23.6426 33.1666 22.6946 33.122 22.1369 32.5098C21.115 31.3877 19.7561 30.75 18.3235 30.75H15.427C12.9835 30.7501 10.6821 32.6482 10.0637 35.6045L8.26683 44.1973C9.3797 44.7704 11.9908 45.75 16.8752 45.75C17.7037 45.75 18.3752 46.4216 18.3752 47.25C18.3752 48.0784 17.7037 48.75 16.8752 48.75C11.2302 48.75 8.08928 47.5398 6.60277 46.709C5.3881 46.0299 5.1048 44.6632 5.31761 43.6455L7.12718 34.9902C7.99051 30.863 11.3509 27.7501 15.427 27.75H18.3235ZM56.5744 27.75C60.6504 27.7502 64.0109 30.8631 64.8743 34.9902L66.6838 43.6455C66.8966 44.6632 66.6133 46.0299 65.3987 46.709C63.9121 47.5398 60.771 48.7499 55.1262 48.75C54.2979 48.7498 53.6262 48.0783 53.6262 47.25C53.6262 46.4217 54.2979 45.7502 55.1262 45.75C60.0084 45.7499 62.62 44.7714 63.7336 44.1982L61.9377 35.6045C61.3194 32.6484 59.0179 30.7502 56.5744 30.75H53.678C52.2456 30.7501 50.8873 31.3879 49.8655 32.5098C49.3078 33.1221 48.3588 33.1666 47.7463 32.6094C47.1339 32.0517 47.0892 31.1027 47.6467 30.4902C49.1817 28.8049 51.3221 27.7501 53.678 27.75H56.5744ZM29.2678 19.4521C29.911 17.0516 32.3789 15.6263 34.7795 16.2695L41.2991 18.0166C43.6997 18.6598 45.1249 21.1277 44.4817 23.5283L42.7346 30.0479C42.1115 32.3735 39.7754 33.7832 37.4475 33.2842L37.2229 33.2305L30.7034 31.4834L30.4807 31.418C28.2883 30.7098 26.9843 28.45 27.467 26.1973L27.5207 25.9717L29.2678 19.4521ZM34.0032 19.168C33.203 18.9536 32.3797 19.4283 32.1653 20.2285L30.4182 26.748C30.2038 27.5482 30.6795 28.3705 31.4797 28.585L37.9993 30.332C38.7994 30.5464 39.6218 30.0717 39.8362 29.2715L41.5832 22.752C41.7976 21.9518 41.3229 21.1295 40.5227 20.915L34.0032 19.168ZM16.8752 9C21.2245 9 24.7502 12.5258 24.7502 16.875C24.7502 21.2242 21.2245 24.75 16.8752 24.75C12.5261 24.7499 9.00023 21.2242 9.00023 16.875C9.00023 12.5258 12.5261 9.00014 16.8752 9ZM55.1252 9C59.4745 9 63.0002 12.5258 63.0002 16.875C63.0002 21.2242 59.4745 24.75 55.1252 24.75C50.7761 24.7499 47.2502 21.2242 47.2502 16.875C47.2502 12.5258 50.7761 9.00014 55.1252 9ZM16.8752 12C14.183 12.0001 12.0002 14.1827 12.0002 16.875C12.0002 19.5673 14.183 21.7499 16.8752 21.75C19.5676 21.75 21.7502 19.5674 21.7502 16.875C21.7502 14.1826 19.5676 12 16.8752 12ZM55.1252 12C52.433 12.0001 50.2502 14.1827 50.2502 16.875C50.2502 19.5673 52.433 21.7499 55.1252 21.75C57.8176 21.75 60.0002 19.5674 60.0002 16.875C60.0002 14.1826 57.8176 12 55.1252 12Z'
        fill='#F7F7F8'
      />
    </svg>
  </div>
);

/**
 * Studio-context user with no studio on record.
 *
 * `POST /api/Studios` is manual-review gated, so the in-product form that
 * once lived here always errored. We funnel users to the Qualtrics survey;
 * once approved, their studio appears in `useMyStudios()` and this component
 * stops rendering.
 */
const StudioProfileCreate: React.FC = () => {
  const handleStartSurvey = useCallback(() => {
    window.open(STUDIO_ONBOARDING_SURVEY_URL, '_blank', 'noopener,noreferrer');
  }, []);

  return (
    <PageContent testId='talent-hub-v2-studio-create'>
      <div className={styles.appliedEmptyState}>
        <StudioOnboardingIllustration />
        {/* oxlint-disable-next-line rbx/no-hardcoded-translation-string - outof scope for this PR. @cmurphy to fix  */}
        <div className='text-align-center text-heading-medium'>Apply to post on Talent Hub</div>
        <div
          className={`text-align-center content-muted text-body-medium ${styles.appliedEmptyText}`}>
          {/* oxlint-disable-next-line rbx/no-hardcoded-translation-string - outof scope for this PR. @cmurphy to fix  */}
          Apply to Talent Hub to gain access to create a studio profile for your group and start
          posting jobs to connect with top talent.
        </div>
        <Button variant='Emphasis' size='Medium' onClick={handleStartSurvey}>
          {/* oxlint-disable-next-line rbx/no-hardcoded-translation-string - outof scope for this PR. @cmurphy to fix  */}
          Apply
        </Button>
      </div>
    </PageContent>
  );
};

const MyStudioPageContent: React.FC = () => {
  const { data: myStudiosData, isFetching } = useMyStudios();
  const { m2Enabled, isFetched: isM2Fetched } = useIsM2Enabled();
  const router = useRouter();

  // After a successful create, the onboarding form lands here with `?created=1`.
  // Surface the same Snackbar pattern used by job-apply / talent-profile flows
  // (see TalentProfileV2Container) and strip the marker from the URL so it
  // doesn't reappear on refresh.
  const [showCreatedSnackbar, setShowCreatedSnackbar] = useState(false);
  useEffect(() => {
    if (!router.isReady) {
      return;
    }
    if (router.query.created === '1') {
      setShowCreatedSnackbar(true);
      const nextQuery = { ...router.query };
      delete nextQuery.created;
      void router.replace({ pathname: router.pathname, query: nextQuery }, undefined, {
        shallow: true,
      });
    }
  }, [router.isReady, router.query, router.pathname, router]);

  let body: ReactNode;
  if (isFetching) {
    body = <LoadingState itemCount={3} />;
  } else {
    const studioId = myStudiosData?.studios?.[0]?.id;
    if (studioId) {
      body = <StudioProfileV2Container studioId={studioId} context='profile' />;
    } else if (!isM2Fetched) {
      body = <LoadingState itemCount={3} />;
    } else if (m2Enabled) {
      body = (
        <PageContent testId='talent-hub-v2-studio-create'>
          <StudioOnboardingEmptyState />
        </PageContent>
      );
    } else {
      body = <StudioProfileCreate />;
    }
  }

  return (
    <>
      {body}
      {showCreatedSnackbar ? (
        <Snackbar
          title='Studio created successfully'
          shouldAutoDismiss
          onClose={() => setShowCreatedSnackbar(false)}
        />
      ) : null}
    </>
  );
};

const MyStudioPage: NextLayoutPage = () => (
  <Authenticated>
    <TalentHubM2Guard>
      <MyStudioPageContent />
    </TalentHubM2Guard>
  </Authenticated>
);

MyStudioPage.getPageLayout = (page: ReactNode) => (
  <TalentHubLayout crumbs={[{ label: 'Manage' }, { label: 'My studio' }]}>{page}</TalentHubLayout>
);

MyStudioPage.loggerConfig = { rosId: RosTeams.Knowledge };
export default MyStudioPage;
