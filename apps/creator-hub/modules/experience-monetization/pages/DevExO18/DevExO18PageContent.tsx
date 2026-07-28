import { StatusCodes } from '@rbx/core';
import { useFlag } from '@rbx/flags';
import { withTranslation } from '@rbx/intl';
import {
  showDevExO18LandingPage,
  showDevExO18LandingPageAnalyticsSection,
} from '@generated/flags/creatorBusiness';
import { O18Eligibility } from '@modules/clients/creatorDevexApi';
import PageLoading from '@modules/miscellaneous/components/PageLoading';
import { ErrorPage, PageNotFound } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useUniversePermissions } from '@modules/react-query/organizations';
import useDevExO18EligibilityState from '../../hooks/useDevExO18EligibilityState';
import DevExO18AnalyticsSection from './DevExO18AnalyticsSection';
import DevExO18CriteriaCard from './DevExO18CriteriaCard';

type DevExO18PageContentProps = {
  universeId: number;
};

function DevExO18PageContent({ universeId }: DevExO18PageContentProps) {
  const { data: permissions, isLoading: isLoadingPermissions } = useUniversePermissions(universeId);
  const {
    isLoading: isLoadingEligibility,
    o18Eligibility,
    eligibilityCriteria,
  } = useDevExO18EligibilityState(universeId);
  const { value: showPageEnabled } = useFlag(showDevExO18LandingPage);
  const { value: showAnalyticsSection } = useFlag(showDevExO18LandingPageAnalyticsSection);

  if (!showPageEnabled) {
    return <PageNotFound />;
  }

  if (isLoadingPermissions || isLoadingEligibility) {
    return <PageLoading />;
  }

  if (o18Eligibility === O18Eligibility.None || o18Eligibility === O18Eligibility.Invalid) {
    return <PageNotFound />;
  }

  if (!permissions?.monetizeExperience && !permissions?.viewAnalytics) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  const isEligible = o18Eligibility === O18Eligibility.Eligible;
  // Surfaced from the API for upcoming criteria UI; not yet rendered.
  void eligibilityCriteria;

  return (
    <section
      className='flex flex-col grow-1 gap-xxlarge margin-bottom-large'
      data-testid='devex-o18-page-content'>
      <div className='flex flex-col medium:flex-row grow-1 gap-xxlarge items-stretch'>
        <div className='flex grow-1 shrink-1 basis-0 min-width-0'>
          <DevExO18CriteriaCard isEligible={isEligible} />
        </div>
        {/* Keep the column so the eligibility card stays at half width even when
            the analytics section is hidden by the flag. */}
        <div className='flex grow-1 shrink-1 basis-0 min-width-0'>
          {showAnalyticsSection && (
            <DevExO18AnalyticsSection universeId={universeId} o18Eligibility={o18Eligibility} />
          )}
        </div>
      </div>
    </section>
  );
}

export default withTranslation(DevExO18PageContent, [TranslationNamespace.DevEx]);
