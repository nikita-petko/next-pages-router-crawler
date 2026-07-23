import React, { FunctionComponent, useCallback, useMemo } from 'react';
import { Alert, AlertTitle, Button, TAlertProps } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useRouter } from 'next/router';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import { useAffiliateProgram } from '../providers/AffiliateProgramProvider';
import { eligibilityDocsLink, eligibilitySettingsLinkCreatorRewards } from '../constants/links';

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
    return undefined;
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
    return undefined;
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
