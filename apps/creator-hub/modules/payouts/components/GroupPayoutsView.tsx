import { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { Organization } from '@modules/clients/organizationApi';
import { CircularProgress, Grid, Typography } from '@rbx/ui';
import { groupsClient } from '@modules/clients';
import {
  RobloxGroupsApiPayoutRecipientRequest,
  RobloxGroupsApiPayoutRecipientRequestRecipientTypeEnum,
  RobloxGroupsApiPayoutRequestPayoutTypeEnum,
} from '@rbx/clients/groups';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
// eslint-disable-next-line no-restricted-imports -- events
import { logOrganizationsEvent, OrganizationsEventName } from '@modules/group/utils/eventUtils';
import { useTranslation } from '@rbx/intl';
import { HttpStatusCodes } from '@modules/miscellaneous/common';
import { ErrorPage } from '@modules/miscellaneous/error';
import { StatusCodes } from '@rbx/core';
import useCurrentOrganization from '@modules/group/hooks/useCurrentOrganization';
import { useAuthentication } from '@modules/authentication/providers';
import PayoutsDetails from './PayoutsDetails';
import { PayoutsBase } from '../interface/PayoutsFormType';
import PayoutType from '../interface/PayoutType';

export type GroupPayoutsViewProps = {
  organization: Organization;
  disabled?: boolean;
};

const GroupPayoutsView: FunctionComponent<GroupPayoutsViewProps> = ({
  organization,
  disabled = false,
}) => {
  const { translate } = useTranslation();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { permissions } = useCurrentOrganization();
  const { user: currentUser } = useAuthentication();

  const [groupPayouts, setGroupPayouts] = useState<PayoutsBase[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    try {
      const groupId = Number.parseInt(organization.groupId, 10);

      const groupPayoutsResponse = await groupsClient.getGroupPayouts(groupId);

      let payouts: PayoutsBase[] = [];
      if (
        permissions?.isOwner ||
        permissions?.canViewRevenueDetails ||
        permissions?.canConfigureRevenueDetails
      ) {
        payouts =
          groupPayoutsResponse.data
            ?.filter(
              (payout) => payout.user?.userId !== undefined && payout.percentage !== undefined,
            )
            ?.map((payout) => {
              return {
                creatorId: (payout.user?.userId as number).toString(),
                percentage: (payout.percentage as number)?.toString(),
              };
            }) ?? [];
      } else {
        // prefilter payouts to be only self if non-privileged user
        payouts =
          groupPayoutsResponse.data
            ?.filter(
              (payout) =>
                payout.user?.userId === currentUser?.id && payout.percentage !== undefined,
            )
            ?.map((payout) => {
              return {
                creatorId: (payout.user?.userId as number).toString(),
                percentage: (payout.percentage as number)?.toString(),
              };
            }) ?? [];
      }

      setGroupPayouts(payouts);
    } catch (e) {
      if ((e as { response: Response })?.response?.status === HttpStatusCodes.FORBIDDEN) {
        setAccessDenied(true);
      } else {
        setError(translate('Error.FailedToLoadGroupPayouts'));
      }
      setGroupPayouts(null);
    }
  }, [organization.groupId, translate, permissions, currentUser?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onSave = useCallback(
    async (payouts: PayoutsBase[]) => {
      try {
        const filteredPayouts = payouts.filter((payout) =>
          Number.isInteger(Number.parseInt(payout.percentage, 10)),
        );

        const payoutRecipients: Array<RobloxGroupsApiPayoutRecipientRequest> = filteredPayouts.map(
          (payout) => {
            return {
              recipientId: Number.parseInt(payout.creatorId, 10),
              recipientType: RobloxGroupsApiPayoutRecipientRequestRecipientTypeEnum.NUMBER_0, // User
              amount: Number.parseInt(payout.percentage, 10),
            };
          },
        );

        const groupId = Number.parseInt(organization.groupId, 10);
        await groupsClient.updateGroupRecurringPayouts(groupId, {
          payoutType: RobloxGroupsApiPayoutRequestPayoutTypeEnum.NUMBER_2, // Percentage
          recipients: payoutRecipients,
        });

        setGroupPayouts(filteredPayouts);

        logOrganizationsEvent(
          unifiedLogger,
          OrganizationsEventName.ClickOrgsConfirmRecurringPayout,
          {
            group_id: organization?.groupId ?? '',
            type: PayoutType.Group,
            payouts: JSON.stringify(payouts),
          },
        );

        return { updateSucceeded: true, translatedErrorMessage: null };
      } catch (e: unknown) {
        // Groups api returns its already translated user facing error message
        const errorResponse = await (e as { response: Response }).response.json();
        const updateErrorMessage = errorResponse?.errors?.[0]?.userFacingMessage;
        // Error will be shown in ConfigurePayoutsForm
        return { updateSucceeded: false, translatedErrorMessage: updateErrorMessage as string };
      }
    },
    [organization.groupId, unifiedLogger],
  );

  return (
    <Grid container>
      {accessDenied && (
        <Grid container item XSmall={12} wrap='wrap'>
          <ErrorPage errorCode={StatusCodes.FORBIDDEN} />
        </Grid>
      )}
      {error !== null && (
        <Grid container justifyContent='center'>
          <Typography color='error'>{error}</Typography>
        </Grid>
      )}
      {!groupPayouts ? (
        error === null &&
        !accessDenied && (
          <Grid container justifyContent='center'>
            <CircularProgress color='secondary' />
          </Grid>
        )
      ) : (
        <PayoutsDetails
          organization={organization}
          payouts={groupPayouts}
          onSave={onSave}
          payoutType={PayoutType.Group}
          disabled={disabled}
        />
      )}
    </Grid>
  );
};

export default GroupPayoutsView;
