import type { FunctionComponent } from 'react';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { buildBreadcrumb, buildTitle, HubMeta } from '@rbx/creator-hub-history';
import { withTranslation, useTranslation } from '@rbx/intl';
import { Grid, CircularProgress } from '@rbx/ui';
import groupsClient from '@modules/clients/groups';
import useCurrentOrganization from '@modules/group/hooks/useCurrentOrganization';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import GroupPayouts from '../components/GroupPayouts';
import NonPermissionedGroupPayouts from '../components/NonPermissionedGroupPayouts';

const PayoutsContainer: FunctionComponent = () => {
  const { translate } = useTranslation();
  const { organization, permissions } = useCurrentOrganization();

  const [canUseOneTimePayout, setCanUseOneTimePayout] = useState<boolean | null>(null);
  const [canUseRecurringPayout, setCanUseRecurringPayout] = useState<boolean | null>(null);

  const fetchGroupEligibility = useCallback(async () => {
    if (!organization?.groupId) {
      return;
    }

    if (
      permissions?.isOwner ||
      permissions?.canConfigureRevenueDetails ||
      permissions?.canViewRevenueDetails
    ) {
      const result = await groupsClient.getGroupPayoutRestriction(Number(organization.groupId));
      setCanUseOneTimePayout(result.canUseOneTimePayout ?? false);
      setCanUseRecurringPayout(result.canUseRecurringPayout ?? false);
    } else {
      // if non-priviliged user, assume payouts enabled so that they can attempt
      // to see the payout api calls
      setCanUseOneTimePayout(true);
      setCanUseRecurringPayout(true);
    }
  }, [organization, permissions]);

  useEffect(() => {
    fetchGroupEligibility();
  }, [fetchGroupEligibility]);

  return (
    <>
      <HubMeta
        title={buildTitle(translate('Heading.Payouts'))}
        breadcrumb={buildBreadcrumb(translate('Heading.Finances'), translate('Heading.Payouts'))}
      />
      {/* Wait until all checks are loaded before showing page content */}
      {!organization ||
      !permissions ||
      canUseOneTimePayout === null ||
      canUseRecurringPayout === null ? (
        <Grid container justifyContent='center'>
          <CircularProgress />
        </Grid>
      ) : (
        <Fragment>
          {permissions.isOwner ||
          permissions.canConfigureRevenueDetails ||
          permissions.canViewRevenueDetails ? (
            <GroupPayouts
              organization={organization}
              permissions={permissions}
              canUseOneTimePayout={canUseOneTimePayout}
              canUseRecurringPayout={canUseRecurringPayout}
            />
          ) : (
            <NonPermissionedGroupPayouts
              organization={organization}
              canUseRecurringPayout={canUseRecurringPayout}
            />
          )}
        </Fragment>
      )}
    </>
  );
};

export default withTranslation(PayoutsContainer, [
  TranslationNamespace.Payouts,
  TranslationNamespace.Navigation,
  TranslationNamespace.PurchaseError,
  TranslationNamespace.NotApproved,
]);
