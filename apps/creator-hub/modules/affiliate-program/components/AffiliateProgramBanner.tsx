import { useRouter } from 'next/router';
import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import type { TAlertProps } from '@rbx/ui';
import { Alert, AlertTitle, Button } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import { eligibilityDocsLink, eligibilitySettingsLinkCreatorRewards } from '../constants/links';
import { useAffiliateProgram } from '../providers/AffiliateProgramProvider';

const AffiliateProgramBanner: FunctionComponent<TAlertProps> = (props) => {
  const { translate } = useTranslation();
  const currentGroup = useCurrentGroup();
  const isGroup = useMemo(() => (currentGroup?.id ?? 0) !== 0, [currentGroup]);

  const { requiresActionToJoinProgram, isGroupEligible, isAffiliateProgramLoading } =
    useAffiliateProgram();

  const router = useRouter();

  const onEligibilitySettingsClick = useCallback(() => {
    router.push(eligibilitySettingsLinkCreatorRewards);
  }, [router]);

  const goToEligibilityDocs = useCallback(() => {
    router.push(eligibilityDocsLink);
  }, [router]);

  if (isAffiliateProgramLoading) {
    return;
  }

  // Variant: Group is ineligible
  if (isGroup && !isGroupEligible) {
    return (
      <Alert
        severity='info'
        action={
          <Button color='inherit' onClick={goToEligibilityDocs}>
            {translate('Action.LearnMore')}
          </Button>
        }
        {...props}>
        <AlertTitle>{translate('Title.EligibilityBannerEarnRewards')}</AlertTitle>
        {translate('Description.EligibilityBannerEarnRewards')}
      </Alert>
    );
  }

  // no action needed, no banner
  if (!requiresActionToJoinProgram) {
    return;
  }

  // Variant: User is ineligible
  return (
    <Alert
      severity='info'
      action={
        <Button color='inherit' onClick={onEligibilitySettingsClick}>
          {translate('Action.LearnMore')}
        </Button>
      }
      {...props}>
      <AlertTitle>{translate('Title.EligibilityBannerEarnRewards')}</AlertTitle>
      {translate('Description.EligibilityBannerEarnRewards')}
    </Alert>
  );
};

export default withTranslation(AffiliateProgramBanner, [TranslationNamespace.AffiliateProgram]);
