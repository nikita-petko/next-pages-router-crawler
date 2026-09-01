import type { FunctionComponent } from 'react';
import React from 'react';
import type { ClaimItem } from '@rbx/client-rights/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, Typography, Divider } from '@rbx/ui';
import { PageLoading } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

interface DetailRejectionBlockProps {
  claimItem: ClaimItem;
}

// DetailRejectionBlock displays the rejection reason for a claim.
const DetailRejectionBlock: FunctionComponent<DetailRejectionBlockProps> = ({ claimItem }) => {
  const { ready, translate } = useTranslation();
  if (!ready) {
    return <PageLoading />;
  }
  const statusReason = claimItem.statusReason
    ?.split(/\\+n/)
    .map((item) => <React.Fragment key={item}>{item} </React.Fragment>);

  return (
    // ----- Why is this custom style here? -----
    // When using rowSpacing in our current version of mui Grid,
    // additional padding is generated on top, and a negative margin-top is produced to counteract this.
    // However, this means that the component would overlap with the item above it, blocking hovering or similar actions.
    // Setting marginTop to 0 fixed the overlap, but moved the item downwards,
    // so the padding is also set to 0 to cancel this out.
    <Grid item container XSmall rowSpacing={3} style={{ marginTop: 0, paddingTop: 0 }}>
      <Grid
        item
        XSmall={12}
        container
        direction='column'
        rowSpacing={3}
        style={{ marginTop: 0, paddingTop: 0 }}>
        <Grid item>
          <Typography variant='h6'>{translate('Heading.RejectionDetails')}</Typography>
        </Grid>
        <Grid item container>
          <Grid item XSmall={12}>
            <Typography variant='body2' color='secondary'>
              {translate('Label.RejectionReason')}
            </Typography>
          </Grid>
          <Grid item XSmall={12}>
            <Typography variant='body2'>{statusReason}</Typography>
          </Grid>
        </Grid>
      </Grid>
      <Grid item XSmall={12}>
        <Divider />
      </Grid>
    </Grid>
  );
};
export default withTranslation(DetailRejectionBlock, [TranslationNamespace.RightsPortal]);
