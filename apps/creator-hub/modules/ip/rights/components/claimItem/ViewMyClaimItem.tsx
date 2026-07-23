import { useEffect, useState } from 'react';
import { Typography, Grid, Breadcrumbs, Link as UILink, Button, Tooltip } from '@rbx/ui';
import { PageLoading } from '@modules/miscellaneous/common';
import Link from 'next/link';
import { Account, ClaimItemDiscoveredFromEnum, ClaimItemStatusEnum } from '@rbx/clients/rightsV1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useIpLayoutContext } from '@modules/ip/IpAppNavigationLayout';
import useClaimItemContentDetails from '../../hooks/useClaimItemContentDetails';
import { ClaimContentRole } from '../../types/types';
import { RightsManagementURL } from '../landing/RightsManagementContainer';
import StatusAlert from './StatusAlert';
import ReportedCreationBlock from './ReportedCreationBlock';
import SnapshotReportedCreationBlock from './SnapshotReportedCreationBlock';
import OriginalCreationBlock from './OriginalCreationBlock';
import DetailClaimBlock from './DetailClaimBlock';
import MyDisputeDetails from './DetailMyDisputeBlock';
import EscalateForm from './ActionFormContent/EscalateForm';
import ReleaseForm from './ActionFormContent/ReleaseForm';
import { ClaimsAgainstContentURL } from '../claimsAgainstContent/ViewClaimsAgainstContent';
import useClaimItem from '../../hooks/useClaimItem';
import useClaimItemDetailStyles from './useClaimItemDetailStyles';
import DetailRejectionBlock from './DetailRejectionBlock';

interface ViewMyClaimItemProps {
  account: Account;
  claimId: string;
  claimItemId: string;
}

// ViewMyClaimItem displays the claim item detail page for a claim I filed
const ViewMyClaimItem = ({ account, claimId, claimItemId }: ViewMyClaimItemProps) => {
  const { ready, translate, translateHTML } = useTranslation();
  const {
    classes: { marginless },
  } = useClaimItemDetailStyles();
  const { claimItem, isLoading } = useClaimItem(account?.id, claimId, claimItemId);
  const accountId = account?.id ?? '';

  const {
    contentId,
    contentType,
    contentDetails,
    isPending: contentLoading,
    error: contentError,
  } = useClaimItemContentDetails(claimItem, ClaimContentRole.Infringing);

  const {
    contentId: originalContentId,
    contentType: originalContentType,
    contentDetails: originalContentDetails,
    isPending: originalContentLoading,
  } = useClaimItemContentDetails(claimItem, ClaimContentRole.Original);
  const originalContentName =
    originalContentDetails?.contentName || translate('Label.OffPlatformCreation');

  const isFromSnapshot = claimItem?.discoveredFrom === ClaimItemDiscoveredFromEnum.Snapshot;

  const { setPageTitle } = useIpLayoutContext();

  useEffect(() => {
    setPageTitle(
      <Breadcrumbs maxItems={2} separator='/'>
        <Typography>
          <Link href={RightsManagementURL} passHref legacyBehavior>
            <UILink color='inherit'>{translate('Label.MyClaims')}</UILink>
          </Link>
        </Typography>
        {!contentError && (
          <Typography variant='largeLabel1'>
            <Link
              href={ClaimsAgainstContentURL(contentType, contentId.toString())}
              passHref
              legacyBehavior>
              <UILink color='inherit'>{contentDetails?.contentName}</UILink>
            </Link>
          </Typography>
        )}
        {!!contentError && (
          <Typography variant='largeLabel1' color='primary'>
            {translate('Label.ID')}: {contentId}
          </Typography>
        )}
      </Breadcrumbs>,
    );
  }, [contentDetails?.contentName, contentError, contentId, contentType, setPageTitle, translate]);

  const [isEscalateFormOpen, setIsEscalateFormOpen] = useState(false);
  const [isReleaseFormOpen, setIsReleaseFormOpen] = useState(false);

  const disputedStatuses: ClaimItemStatusEnum[] = [
    ClaimItemStatusEnum.Dispute,
    ClaimItemStatusEnum.DropAfterDispute,
    ClaimItemStatusEnum.Keep,
    ClaimItemStatusEnum.Takedown,
    ClaimItemStatusEnum.Escalate,
  ];
  const isClaimDisputed = !!claimItem?.status && disputedStatuses.includes(claimItem.status);

  if (!ready || isLoading || contentLoading || originalContentLoading) {
    return <PageLoading />;
  }

  if (!claimItem || claimItem?.contents?.length === 0 || claimItem?.contentIds?.length === 0) {
    return null;
  }
  const shouldShowEscalate = claimItem.status === ClaimItemStatusEnum.Dispute;
  return (
    <Grid container direction='column' spacing={3}>
      <Grid item container direction='column' spacing={1} className={marginless}>
        <Grid item container spacing={1}>
          <Grid item XSmall>
            {!contentError && <Typography variant='h1'>{contentDetails?.contentName}</Typography>}
            {!!contentError && (
              <Typography variant='h1'>
                {translate('Label.ID')}: {contentId}
              </Typography>
            )}
          </Grid>
          <Grid item container XSmall justifyContent='flex-end' columnGap={1}>
            {shouldShowEscalate && (
              <Tooltip
                title={
                  <div style={{ lineHeight: '1.5' }}>
                    {translateHTML('Description.EscalateTooltip', [
                      {
                        opening: 'redStart',
                        closing: 'redEnd',
                        content(chunks) {
                          return <span style={{ color: 'red' }}>{chunks}</span>;
                        },
                      },
                    ])}
                  </div>
                }
                componentsProps={{ tooltip: { sx: { maxWidth: '500px' } } }}
                placement='bottom-end'>
                <Button
                  variant='contained'
                  color='secondary'
                  disabled={claimItem?.status !== ClaimItemStatusEnum.Dispute}
                  onClick={() => setIsEscalateFormOpen(true)}>
                  {translate('Label.EscalateClaim')}
                </Button>
              </Tooltip>
            )}
            <EscalateForm
              open={isEscalateFormOpen}
              setOpen={setIsEscalateFormOpen}
              accountId={accountId}
              claimId={claimId}
              claimItemId={claimItemId}
              claimItem={claimItem}
            />
            <Tooltip
              title={
                <div style={{ lineHeight: '1.5' }}>
                  {translateHTML('Description.ReleaseTooltip', [
                    {
                      opening: 'redStart',
                      closing: 'redEnd',
                      content(chunks) {
                        return <span style={{ color: 'red' }}>{chunks}</span>;
                      },
                    },
                  ])}
                </div>
              }
              componentsProps={{ tooltip: { sx: { maxWidth: '600px' } } }}
              placement='bottom-end'>
              <Button
                variant='contained'
                color='secondary'
                disabled={
                  !(
                    claimItem?.status === ClaimItemStatusEnum.Pending ||
                    claimItem?.status === ClaimItemStatusEnum.Dispute
                  )
                }
                onClick={() => setIsReleaseFormOpen(true)}>
                {translate('Label.ReleaseClaim')}
              </Button>
            </Tooltip>
            <ReleaseForm
              open={isReleaseFormOpen}
              setOpen={setIsReleaseFormOpen}
              accountId={accountId}
              claimId={claimId}
              claimItemId={claimItemId}
            />
          </Grid>
        </Grid>
      </Grid>
      <Grid container item XSmall>
        <StatusAlert claimItem={claimItem} />
      </Grid>
      {claimItem.status === ClaimItemStatusEnum.Keep && (
        <DetailRejectionBlock claimItem={claimItem} />
      )}
      <Grid item>
        <Typography variant='h6'>{translate('Heading.CreationComparison')}</Typography>
      </Grid>
      <Grid item container spacing={3}>
        {isFromSnapshot ? (
          <SnapshotReportedCreationBlock claimItem={claimItem} isAllegedInfringer={false} />
        ) : (
          <ReportedCreationBlock
            claimItem={claimItem}
            translate={translate}
            contentName={contentDetails?.contentName}
            contentId={contentId}
            contentType={contentType}
            contentError={!!contentError}
            creatorName={contentDetails?.creatorName}
            creatorId={contentDetails.creatorId}
            creatorType={contentDetails.creatorType}
            isAllegedInfringer={false}
          />
        )}
        <OriginalCreationBlock
          claimItem={claimItem}
          translate={translate}
          originalContentName={originalContentName}
          originalContentId={originalContentId}
          originalContentType={originalContentType}
          originalCreatorName={originalContentDetails?.creatorName}
          originalCreatorId={originalContentDetails.creatorId}
          isAllegedInfringer={false}
        />
        <Grid XSmall item />
        <Grid XSmall item />
      </Grid>
      {isClaimDisputed && claimItem.dispute && (
        <Grid item container XSmall rowSpacing={3} className={marginless}>
          <MyDisputeDetails dispute={claimItem.dispute} />
        </Grid>
      )}
      <Grid
        item
        container
        XSmall
        rowSpacing={3}
        className={!(isClaimDisputed && claimItem.dispute) ? marginless : ''}>
        <DetailClaimBlock accountId={accountId} claimItem={claimItem} translate={translate} />
      </Grid>
    </Grid>
  );
};

export default withTranslation(ViewMyClaimItem, [TranslationNamespace.RightsPortal]);
