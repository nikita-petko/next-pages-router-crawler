import { TranslationNamespace } from '@modules/miscellaneous/localization';

import { withTranslation } from '@rbx/intl';
import { Grid, Typography, Divider, DescriptionIcon } from '@rbx/ui';
import React, { FunctionComponent } from 'react';
import { ClaimItem, ClaimItemStatusEnum } from '@rbx/clients/rightsV1';
import { PageLoading } from '@modules/miscellaneous/common';
import useClaim from '../../hooks/useClaim';

interface DetailClaimBlockProps {
  accountId: string;
  claimItem: ClaimItem;
  translate: (key: string) => string;
}

// DetailClaimBlock displays detailed information about a specific claim, only viewed by the rights holder.
const DetailClaimBlock: FunctionComponent<DetailClaimBlockProps> = ({
  accountId,
  claimItem,
  translate,
}) => {
  const { claim, isPending: claimLoading } = useClaim(claimItem.claimId ?? '', accountId);
  const claimEscalated =
    claimItem?.status === ClaimItemStatusEnum.Keep ||
    claimItem?.status === ClaimItemStatusEnum.Takedown ||
    claimItem?.status === ClaimItemStatusEnum.Escalate;
  const hasDescription = !!claimItem?.notes && claimItem.notes.length > 0;
  const hasDocumentation = !!claimItem?.originalDocuments && claimItem.originalDocuments.length > 0;

  if (claimLoading) {
    return <PageLoading />;
  }
  return (
    <Grid item container XSmall rowSpacing={3}>
      {claimEscalated && (hasDescription || hasDocumentation) && (
        <Grid item XSmall container direction='column' rowSpacing={3}>
          <Grid item>
            <Divider />
          </Grid>
          <Grid item>
            <Typography variant='h6'>{translate('Heading.EscalationDetails')}</Typography>
          </Grid>
          {hasDescription && (
            <Grid item container>
              <Grid item XSmall={12}>
                <Typography variant='body2' color='secondary'>
                  {translate('Label.Description')}
                </Typography>
              </Grid>
              <Grid item XSmall={12}>
                <Typography variant='body2'>{claimItem?.notes}</Typography>
              </Grid>
            </Grid>
          )}
          {hasDocumentation && (
            <Grid item container rowSpacing={1}>
              <Grid item XSmall={12}>
                <Typography variant='body2' color='secondary'>
                  {translate('Heading.SupportingDocumentation')}
                </Typography>
              </Grid>
              <Grid item container XSmall={12} rowSpacing={1}>
                {claimItem?.originalDocuments?.map((document) => {
                  return (
                    <Grid item container key={document.id} columnSpacing={2}>
                      <Grid item>
                        <DescriptionIcon color='secondary' />
                      </Grid>
                      <Grid item>
                        <Typography variant='body2'>{document.name}</Typography>
                      </Grid>
                    </Grid>
                  );
                })}
              </Grid>
            </Grid>
          )}
        </Grid>
      )}
      <Grid item XSmall={12}>
        <Divider />
      </Grid>
      <Grid item XSmall={12} container direction='column' rowSpacing={3}>
        <Grid item>
          <Typography variant='h6'>{translate('Heading.Dates')}</Typography>
        </Grid>
        <Grid item container>
          <Grid item XSmall={12}>
            <Typography variant='body2' color='secondary'>
              {translate('Heading.LastUpdatedDate')}
            </Typography>
          </Grid>
          <Grid item XSmall={12}>
            <Typography variant='body2'>{claimItem?.updatedAt?.toLocaleDateString()}</Typography>
          </Grid>
        </Grid>
        <Grid item container>
          <Grid item XSmall={12}>
            <Typography variant='body2' color='secondary'>
              {translate('Heading.CreatedDate')}
            </Typography>
          </Grid>
          <Grid item XSmall={12}>
            <Typography variant='body2'>{claimItem?.createdAt?.toLocaleDateString()}</Typography>
          </Grid>
        </Grid>
      </Grid>
      <Grid item XSmall={12}>
        <Divider />
      </Grid>
      <Grid item XSmall={12} container direction='column' rowSpacing={3}>
        <Grid item>
          <Typography variant='h6'>{translate('Heading.ClaimItem')}</Typography>
        </Grid>
        <Grid item container>
          <Grid item XSmall={12}>
            <Typography variant='body2' color='secondary'>
              {translate('Label.ClaimID')}
            </Typography>
          </Grid>
          <Grid item XSmall={12}>
            <Typography variant='body2'>{claimItem?.claimId}</Typography>
          </Grid>
        </Grid>
        <Grid item container>
          <Grid item XSmall={12}>
            <Typography variant='body2' color='secondary'>
              {translate('Description.NameOfParentClaim')}
            </Typography>
          </Grid>
          <Grid item XSmall={12}>
            <Typography variant='body2'>{claim?.description}</Typography>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};
export default withTranslation(DetailClaimBlock, [TranslationNamespace.RightsPortal]);
