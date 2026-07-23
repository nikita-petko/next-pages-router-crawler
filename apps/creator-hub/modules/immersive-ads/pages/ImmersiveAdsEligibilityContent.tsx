import React, { useMemo, useCallback, useEffect, useState, FC } from 'react';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation, withTranslation } from '@rbx/intl';
import useStudio, { EStudioTaskType } from '@modules/miscellaneous/hooks/useStudio';
import { useRouter } from 'next/router';
import {
  AccessTimeIcon,
  Button,
  CalendarMonthOutlinedIcon,
  CheckCircleOutlineIcon,
  FactCheckIcon,
  FileCopyOutlinedIcon,
  Divider,
  FingerprintOutlinedIcon,
  HelpOutlineOutlinedIcon,
  HighlightOffIcon,
  OpenInNewIcon,
  PublicOutlinedIcon,
  Typography,
  VerifiedUserOutlinedIcon,
} from '@rbx/ui';
import { useSnackbarAlert } from '@modules/miscellaneous/hooks';
import { useSettings } from '@modules/settings';
import { useUniverseResource } from '@modules/experience-analytics-shared';
import useImmersiveAdsPageStyles from './ImmersiveAdsPage.styles';
import { ModerationStatus, useEligibility } from '../contexts';

interface RerouteAction {
  label: string;
  url: string;
}

interface FunctionAction {
  label: string;
  func: () => void;
}

const REQUESTED_REVIEW_KEY = 'immersive_ads_eligibility_requested_cmq_review';
const REQUESTED_REVIEW_TTL_MS = 24 * 60 * 60 * 1000; // 1 day

function getHasRequestedReviewFromCache(universeId: number): number | null {
  const val = localStorage.getItem(`${REQUESTED_REVIEW_KEY}_${universeId}`);
  if (!val) return null;
  const requestedAt = Number.parseInt(val, 10);
  return Number.isNaN(requestedAt) ? null : requestedAt;
}

function setHasRequestedReviewFromCache(universeId: number): void {
  localStorage.setItem(`${REQUESTED_REVIEW_KEY}_${universeId}`, String(Date.now()));
}

function clearHasRequestedReviewFromCache(universeId: number): void {
  localStorage.removeItem(`${REQUESTED_REVIEW_KEY}_${universeId}`);
}

const EligibilityRow = ({
  eligibilityInfo,
  eligibilityDetails,
  universePassesEligibilityItem,
  icon,
  action,
  showActionButton = true,
  actionDisabled = false,
  actionButtonColor = 'secondary',
  showActionButtonIcon = true,
  incompleteIcon,
}: {
  eligibilityInfo: string;
  eligibilityDetails: string;
  universePassesEligibilityItem: boolean;
  icon: React.ReactNode;
  action?: RerouteAction | FunctionAction;
  showActionButton?: boolean;
  actionDisabled?: boolean;
  actionButtonColor?: 'primaryBrand' | 'secondary';
  showActionButtonIcon?: boolean;
  incompleteIcon?: React.ReactNode;
}) => {
  const {
    classes: {
      eligibilityDescriptionContainer,
      eligibilityRowDividerStyle,
      eligibilityRowContainer,
      actionButtonStyle,
      openInNewIconContainer,
    },
  } = useImmersiveAdsPageStyles();

  const handleClick = () => {
    if (action) {
      if ('url' in action) {
        window.location.href = action.url;
      } else if ('func' in action && action.func) {
        action.func();
      }
    }
  };

  return (
    <div>
      <div className={eligibilityRowContainer}>
        <div>{icon}</div>
        <div className={eligibilityDescriptionContainer}>
          <Typography variant='body1'>{eligibilityInfo}</Typography>
          <Typography variant='body2'>{eligibilityDetails}</Typography>
        </div>
        {universePassesEligibilityItem ? (
          <div>
            <CheckCircleOutlineIcon color='success' />
          </div>
        ) : (
          <div>
            {showActionButton && (
              <Button
                onClick={handleClick}
                className={actionButtonStyle}
                size='medium'
                variant='contained'
                color={actionButtonColor}
                disabled={actionDisabled}>
                {action?.label}
                {showActionButtonIcon && <OpenInNewIcon className={openInNewIconContainer} />}
              </Button>
            )}
            {incompleteIcon ?? <HighlightOffIcon color='error' />}
          </div>
        )}
      </div>
      <Divider className={eligibilityRowDividerStyle} />
    </div>
  );
};

const IDVerificationIcon = ({
  isUniverseOwnerVerified,
  isUserAgeEligible,
  isUniverseOwner,
  actionLabel,
}: {
  isUniverseOwnerVerified: boolean;
  isUserAgeEligible: boolean;
  isUniverseOwner: boolean;
  actionLabel: string;
}) => {
  const {
    classes: { actionButtonStyle, openInNewIconContainer },
  } = useImmersiveAdsPageStyles();

  const userSettingsUrl = useMemo(() => {
    const url = `https://www.${process.env.robloxSiteDomain}/my/account#!/info`;
    return url;
  }, []);

  const handleButtonClick = () => {
    window.location.href = userSettingsUrl;
  };

  if (!isUniverseOwnerVerified) {
    return (
      <div>
        <Button
          onClick={handleButtonClick}
          className={actionButtonStyle}
          size='medium'
          variant='contained'
          color='secondary'>
          {actionLabel}
          {isUniverseOwner ? (
            <OpenInNewIcon className={openInNewIconContainer} />
          ) : (
            <FileCopyOutlinedIcon className={openInNewIconContainer} />
          )}
        </Button>
        <HighlightOffIcon color='error' />
      </div>
    );
  }
  return isUserAgeEligible ? (
    <CheckCircleOutlineIcon color='success' />
  ) : (
    <HighlightOffIcon color='error' />
  );
};

const IDEligibilityRow = ({
  isUniverseOwnerVerified,
  isUniverseOwner,
  isUserAgeEligible,
}: {
  isUniverseOwnerVerified: boolean;
  isUniverseOwner: boolean;
  isUserAgeEligible: boolean;
}) => {
  const {
    classes: {
      eligibilityDescriptionContainer,
      eligibilityRowDividerStyle,
      eligibilityRowContainer,
      eligibilityIconStyle,
    },
  } = useImmersiveAdsPageStyles();

  const { translate } = useTranslation();
  let userIDVerificationDescription = '';
  let userIDVerificationDescriptionDetails = '';
  if (isUniverseOwner) {
    userIDVerificationDescription = translate('Description.VerifyIDv2');
    userIDVerificationDescriptionDetails = translate('Description.VerifyIDDetailsv2');
  } else {
    userIDVerificationDescription = translate('Description.VerifyOwnerIDv2');
    userIDVerificationDescriptionDetails = translate('Description.VerifyOwnerIDDetailsv2');
  }

  const isOwnerVerifiedAndNotAgeEligible = isUniverseOwnerVerified && !isUserAgeEligible;
  if (isOwnerVerifiedAndNotAgeEligible) {
    userIDVerificationDescription = translate('Description.AccountUnder13');
    userIDVerificationDescriptionDetails = translate('Description.AccountUnder13Details');
  }

  return (
    <div>
      <div className={eligibilityRowContainer}>
        <div>
          <VerifiedUserOutlinedIcon className={eligibilityIconStyle} />
        </div>
        <div className={eligibilityDescriptionContainer}>
          <Typography
            color={isOwnerVerifiedAndNotAgeEligible ? 'error' : undefined}
            variant='body1'>
            {userIDVerificationDescription}
          </Typography>
          <Typography variant='body2'>{userIDVerificationDescriptionDetails}</Typography>
        </div>
        <IDVerificationIcon
          isUniverseOwnerVerified={isUniverseOwnerVerified}
          isUserAgeEligible={isUserAgeEligible}
          isUniverseOwner={isUniverseOwner}
          actionLabel={translate('Label.IDVerification')}
        />
      </div>
      <Divider className={eligibilityRowDividerStyle} />
    </div>
  );
};

const TwoStepEligibilityRow = ({
  isUniverseOwner2FAEnabled,
  isUniverseOwner,
  eligibilityInfo,
  eligibilityDetails,
}: {
  isUniverseOwner2FAEnabled: boolean;
  isUniverseOwner: boolean;
  eligibilityInfo: string;
  eligibilityDetails: string;
}) => {
  const {
    classes: {
      eligibilityDescriptionContainer,
      eligibilityRowDividerStyle,
      eligibilityRowContainer,
      eligibilityIconStyle,
      actionButtonStyle,
      openInNewIconContainer,
    },
  } = useImmersiveAdsPageStyles();

  const { translate } = useTranslation();

  const twoStepVerificationUrl = useMemo(() => {
    const url = `https://www.${process.env.robloxSiteDomain}/my/account#!/security`;
    return url;
  }, []);

  const handleClick = () => {
    window.location.href = twoStepVerificationUrl;
  };

  return (
    <div>
      <div className={eligibilityRowContainer}>
        <div>
          <FingerprintOutlinedIcon className={eligibilityIconStyle} />
        </div>
        <div className={eligibilityDescriptionContainer}>
          <Typography variant='body1'>{eligibilityInfo}</Typography>
          <Typography variant='body2'>{eligibilityDetails}</Typography>
        </div>
        {isUniverseOwner2FAEnabled ? (
          <div>
            <CheckCircleOutlineIcon color='success' />
          </div>
        ) : (
          <div>
            <Button
              onClick={handleClick}
              className={actionButtonStyle}
              size='medium'
              variant='contained'
              color='secondary'>
              {translate('Label.TwoStepVerification')}
              {isUniverseOwner ? (
                <OpenInNewIcon className={openInNewIconContainer} />
              ) : (
                <FileCopyOutlinedIcon className={openInNewIconContainer} />
              )}
            </Button>
            <HighlightOffIcon color='error' />
          </div>
        )}
      </div>
      <Divider className={eligibilityRowDividerStyle} />
    </div>
  );
};

const ImmersiveAdsEligibilityContent: FC<React.PropsWithChildren<unknown>> = () => {
  const {
    classes: {
      descriptionStyle,
      eligibilityActionsContainer,
      eligibilityContainer,
      eligibilityIconStyle,
      openInNewIconContainer,
      insertAdsButtonContainer,
    },
  } = useImmersiveAdsPageStyles();
  const { translate } = useTranslation();
  const router = useRouter();
  const showSnackbarMessage = useSnackbarAlert();
  const { open } = useStudio();
  const { settings } = useSettings();
  const {
    eligibilityState: {
      isUniverseEligible,
      isUniverseOwnerVerified,
      isUniverseOwner2FAEnabled,
      isUniversePublic,
      isExperienceGuidelinesCompleted,
      isUniverseOverAnalyticsThreshold,
      isUniverseOwner,
      isUniverseOwnerAgeEligible,
      isExperienceNotRestricted,
      doesExperienceNotContainFreeFormUgc,
      experienceGuidelinesModerationStatus,
    },
    requestQuestionnaireReview,
  } = useEligibility();

  const isQuestionnaireNotApproved =
    experienceGuidelinesModerationStatus !== ModerationStatus.Approved;

  const meetsQuestionnaireContentRequirements =
    isExperienceGuidelinesCompleted &&
    isExperienceNotRestricted &&
    doesExperienceNotContainFreeFormUgc;

  const isExperienceGuidelinesRejectedOrProhibited =
    experienceGuidelinesModerationStatus === ModerationStatus.Rejected ||
    experienceGuidelinesModerationStatus === ModerationStatus.ProhibitedContent;
  const isPendingGuidelinesModeration =
    isUniverseEligible && isQuestionnaireNotApproved && !isExperienceGuidelinesRejectedOrProhibited;

  const { id: universeId } = useUniverseResource();

  const [hasRequestedQuestionnaireReview, setHasRequestedQuestionnaireReview] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || universeId <= 0) return;
    const isFinalStatus =
      experienceGuidelinesModerationStatus === ModerationStatus.Approved ||
      experienceGuidelinesModerationStatus === ModerationStatus.Rejected ||
      experienceGuidelinesModerationStatus === ModerationStatus.ProhibitedContent;
    if (isFinalStatus) {
      clearHasRequestedReviewFromCache(universeId);
      setHasRequestedQuestionnaireReview(false);
    } else {
      const requestedAt = getHasRequestedReviewFromCache(universeId);
      const isWithinTtl =
        requestedAt !== null && Date.now() - requestedAt <= REQUESTED_REVIEW_TTL_MS;
      if (!isWithinTtl) clearHasRequestedReviewFromCache(universeId);
      setHasRequestedQuestionnaireReview(isWithinTtl);
    }
  }, [universeId, experienceGuidelinesModerationStatus]);

  const redirectToContentSettingsPage = () => {
    router.push(`/dashboard/creations/experiences/${universeId}/configure`);
  };

  const redirectToExperienceQuestionnairePage = () => {
    router.push(`/dashboard/creations/experiences/${universeId}/experience-questionnaire`);
  };

  const handleRequestQuestionnaireReviewClick = useCallback(async () => {
    if (universeId <= 0) return;
    try {
      await requestQuestionnaireReview(universeId);
      setHasRequestedReviewFromCache(universeId);
      setHasRequestedQuestionnaireReview(true);
    } catch {
      clearHasRequestedReviewFromCache(universeId);
      setHasRequestedQuestionnaireReview(false);
      showSnackbarMessage('error', translate('Label.RequestQuestionnaireReviewError'));
    }
  }, [universeId, requestQuestionnaireReview, showSnackbarMessage, translate]);

  const handleInsertAdsButtonClick = useCallback(() => {
    open({ task: EStudioTaskType.Default });
  }, [open]);

  return (
    <div className={eligibilityContainer}>
      <div className={descriptionStyle}>
        <Typography>{translate('Description.ChecklistForEligibility')}</Typography>
      </div>
      <div className={insertAdsButtonContainer}>
        <Button
          color='primaryBrand'
          size='medium'
          variant='contained'
          disabled={!isUniverseEligible || isQuestionnaireNotApproved}
          onClick={handleInsertAdsButtonClick}>
          {translate('Label.InsertAds')}
          <div className={openInNewIconContainer}>
            <OpenInNewIcon />
          </div>
        </Button>
      </div>
      <div className={eligibilityActionsContainer}>
        <IDEligibilityRow
          isUniverseOwnerVerified={isUniverseOwnerVerified}
          isUniverseOwner={isUniverseOwner}
          isUserAgeEligible={isUniverseOwnerAgeEligible}
        />
        <TwoStepEligibilityRow
          isUniverseOwner2FAEnabled={isUniverseOwner2FAEnabled}
          isUniverseOwner={isUniverseOwner}
          eligibilityInfo={
            isUniverseOwner
              ? translate('Description.VerifyTwoStep')
              : translate('Description.VerifyOwnerTwoStep')
          }
          eligibilityDetails={
            isUniverseOwner
              ? translate('Description.VerifyTwoStepDetails')
              : translate('Description.VerifyOwnerTwoStepDetails')
          }
        />
        <EligibilityRow
          eligibilityInfo={translate('Description.VerifyPublicExperience')}
          eligibilityDetails={translate('Description.VerifyPublicExperienceDetails')}
          universePassesEligibilityItem={isUniversePublic}
          icon={<PublicOutlinedIcon className={eligibilityIconStyle} />}
          action={{
            label: translate('Label.ContentSettings'),
            func: () => redirectToContentSettingsPage(),
          }}
        />
        <EligibilityRow
          eligibilityInfo={
            settings.isContentMaturityRenameEnabled
              ? translate('Description.VerifyContentMaturityQuestionnaire')
              : translate('Description.VerifyQuestionnaire')
          }
          eligibilityDetails={translate('Description.VerifyQuestionnaireDetailsv2')}
          universePassesEligibilityItem={
            !isExperienceGuidelinesRejectedOrProhibited && meetsQuestionnaireContentRequirements
          }
          icon={<HelpOutlineOutlinedIcon className={eligibilityIconStyle} />}
          action={{
            label: translate('Label.Questionnaire'),
            func: () => redirectToExperienceQuestionnairePage(),
          }}
        />
        <EligibilityRow
          eligibilityInfo={translate('Description.VerifyMAU')}
          eligibilityDetails={translate('Description.VerifyMAUDetails')}
          universePassesEligibilityItem={isUniverseOverAnalyticsThreshold}
          icon={<CalendarMonthOutlinedIcon className={eligibilityIconStyle} />}
          showActionButton={false}
        />
        {isPendingGuidelinesModeration && (
          <EligibilityRow
            eligibilityInfo={translate('Label.NeedsQuestionnaireReview')}
            eligibilityDetails={translate('Label.NeedsQuestionnaireReviewDetail')}
            universePassesEligibilityItem={false}
            icon={<FactCheckIcon className={eligibilityIconStyle} />}
            action={{
              label: translate(
                hasRequestedQuestionnaireReview
                  ? 'Label.QuestionnaireReviewRequested'
                  : 'Label.RequestQuestionnaireReview',
              ),
              func: handleRequestQuestionnaireReviewClick,
            }}
            actionDisabled={hasRequestedQuestionnaireReview}
            actionButtonColor='primaryBrand'
            showActionButtonIcon={false}
            incompleteIcon={<AccessTimeIcon color='warning' />}
          />
        )}
      </div>
    </div>
  );
};

export default withTranslation(ImmersiveAdsEligibilityContent, [
  TranslationNamespace.ImmersiveAdsAnalytics,
]);
