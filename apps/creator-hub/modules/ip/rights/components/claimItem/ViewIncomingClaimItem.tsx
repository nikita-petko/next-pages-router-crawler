import { useEffect, useState } from 'react';
import { Typography, Grid, Breadcrumbs, Link as UILink, Button, Tooltip } from '@rbx/ui';
import { PageLoading } from '@modules/miscellaneous/common';
import Link from 'next/link';
import { Account, ClaimContentContentTypeEnum, ClaimItemStatusEnum } from '@rbx/clients/rightsV1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useIpLayoutContext } from '@modules/ip/IpAppNavigationLayout';
import useIncomingClaimItem from '../../hooks/useIncomingClaimItem';
import useContentDetails from '../../hooks/useContentDetails';
import { RightsManagementURL } from '../landing/RightsManagementContainer';
import StatusAlert from './StatusAlert';
import ReportedCreationBlock from './ReportedCreationBlock';
import OriginalCreationBlock from './OriginalCreationBlock';
import DisputeDetails from './DetailDisputeBlock';
import DetailImpactBlock from './DetailImpactBlock';
import DisputeForm from './ActionFormContent/DisputeForm';
import AcceptForm from './ActionFormContent/AcceptForm';
import OnboardingModal from './OnboardingModal';
import { ClaimsAgainstContentURL } from '../claimsAgainstContent/ViewClaimsAgainstContent';
import useClaimItemDetailStyles from './useClaimItemDetailStyles';
import DetailRejectionBlock from './DetailRejectionBlock';

interface ViewIncomingClaimItemProps {
  account: Account;
  claimId: string;
  claimItemId: string;
}

// ViewIncomingClaimItem displays the claim item detail page for a claim against me
const ViewIncomingClaimItem = ({ account, claimId, claimItemId }: ViewIncomingClaimItemProps) => {
  const { ready, translate, translateHTML } = useTranslation();
  const {
    classes: { marginless },
  } = useClaimItemDetailStyles();
  const { claimItem, isLoading } = useIncomingClaimItem(account?.id, claimItemId);

  // get alleged infringer content
  const contentId = parseInt(claimItem?.contents?.[0].contentId ?? '-1', 10);
  const contentType = claimItem?.contents?.[0].contentType ?? ClaimContentContentTypeEnum.Asset;
  const {
    contentDetails,
    isPending: contentLoading,
    error: contentError,
  } = useContentDetails(contentId, contentType);

  // get original content. useClaimItemContentDetails is not used as the claim item metadata endpoint
  // currently only applies to claim items you create, not claim items against you.
  const originalContentId = parseInt(claimItem?.content?.contentId ?? '-1', 10);
  const originalContentType = claimItem?.content?.contentType ?? ClaimContentContentTypeEnum.Asset;
  const { contentDetails: originalContentDetails, isPending: originalContentLoading } =
    useContentDetails(originalContentId, originalContentType);
  const originalContentName =
    originalContentDetails?.contentName || translate('Label.OffPlatformCreation');

  const disputedStatuses: ClaimItemStatusEnum[] = [
    ClaimItemStatusEnum.Dispute,
    ClaimItemStatusEnum.DropAfterDispute,
    ClaimItemStatusEnum.Keep,
    ClaimItemStatusEnum.Takedown,
    ClaimItemStatusEnum.Escalate,
  ];
  const isClaimDisputed = !!claimItem?.status && disputedStatuses.includes(claimItem.status);

  const isImpacted =
    claimItem?.status === ClaimItemStatusEnum.Pending ||
    claimItem?.status === ClaimItemStatusEnum.Accept;

  const [isDisputeFormOpen, setIsDisputeFormOpen] = useState(false);
  const [isAcceptFormOpen, setIsAcceptFormOpen] = useState(false);

  const { setPageTitle } = useIpLayoutContext();

  useEffect(() => {
    setPageTitle(
      <Breadcrumbs maxItems={3} separator='/'>
        <Typography>
          <Link href={RightsManagementURL} passHref legacyBehavior>
            <UILink color='inherit'>{translate('Label.ClaimsAgainstMe')}</UILink>
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
        <Typography variant='largeLabel1' color='primary'>
          {originalContentName}
        </Typography>
      </Breadcrumbs>,
    );
  }, [
    contentDetails?.contentName,
    contentError,
    contentId,
    contentType,
    originalContentName,
    setPageTitle,
    translate,
  ]);

  if (!ready || isLoading || contentLoading || originalContentLoading) {
    return <PageLoading />;
  }

  if (!claimItem || claimItem?.contents?.length === 0 || claimItem?.contentIds?.length === 0) {
    return null;
  }

  return (
    <Grid container direction='column' spacing={3}>
      <Grid item container direction='column' spacing={1} className={marginless}>
        <Grid item container spacing={1}>
          <Grid item XSmall>
            <Typography variant='h1'>{originalContentName}</Typography>
          </Grid>

          <Grid item container XSmall justifyContent='flex-end' columnGap={1}>
            <Tooltip
              title={
                <div style={{ lineHeight: '1.5' }}>
                  {translateHTML('Description.DisputeTooltip', [
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
                disabled={claimItem?.status !== ClaimItemStatusEnum.Pending}
                onClick={() => setIsDisputeFormOpen(true)}>
                {translate('Label.DisputeClaim')}
              </Button>
            </Tooltip>
            <DisputeForm
              open={isDisputeFormOpen}
              setOpen={setIsDisputeFormOpen}
              claimantName={originalContentDetails.creatorName}
              accountId={account.id ?? ''}
              claimId={claimId}
              claimItemId={claimItemId}
              isClaimedContentDevMarketplace={contentDetails.isDevMarketplace}
            />
            <Tooltip
              title={
                <div style={{ lineHeight: '1.5' }}>
                  {translateHTML('Description.AcceptTooltip', [
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
                disabled={claimItem?.status !== ClaimItemStatusEnum.Pending}
                onClick={() => setIsAcceptFormOpen(true)}>
                {translate('Label.AcceptClaim')}
              </Button>
            </Tooltip>
            <AcceptForm
              open={isAcceptFormOpen}
              setOpen={setIsAcceptFormOpen}
              accountId={account?.id ?? ''}
              claimId={claimId}
              claimItemId={claimItemId}
            />
          </Grid>
        </Grid>
      </Grid>
      <Grid container item XSmall>
        <StatusAlert claimItem={claimItem} isAllegedInfringer />
      </Grid>
      {claimItem.status === ClaimItemStatusEnum.Keep && (
        <DetailRejectionBlock claimItem={claimItem} />
      )}
      <Grid item>
        <Typography variant='h6'>{translate('Heading.CreationComparison')}</Typography>
      </Grid>
      <Grid item container spacing={3}>
        <OriginalCreationBlock
          claimItem={claimItem}
          translate={translate}
          originalContentName={originalContentName}
          originalContentId={originalContentId}
          originalContentType={originalContentType}
          originalCreatorName={originalContentDetails?.creatorName}
          originalCreatorId={originalContentDetails.creatorId}
          isAllegedInfringer
        />
        <ReportedCreationBlock
          claimItem={claimItem}
          translate={translate}
          contentName={contentDetails.contentName}
          contentId={contentId}
          contentType={contentType}
          contentError={!!contentError}
          creatorName={contentDetails.creatorName}
          creatorId={contentDetails.creatorId}
          creatorType={contentDetails.creatorType}
          isAllegedInfringer
        />
        <Grid XSmall item />
        <Grid XSmall item />
      </Grid>
      <Grid item container XSmall rowSpacing={3} className={marginless}>
        <Grid item container XSmall rowSpacing={3}>
          <DetailImpactBlock
            isImpacted={isImpacted}
            isDevMarketplace={contentDetails.isDevMarketplace}
            translate={translate}
          />
          {isClaimDisputed && (
            <DisputeDetails
              claimItemId={claimItemId}
              accountId={claimItem?.targetAccountId ?? ''}
            />
          )}
        </Grid>
      </Grid>
      <OnboardingModal />
    </Grid>
  );
};

export default withTranslation(ViewIncomingClaimItem, [TranslationNamespace.RightsPortal]);
