import type { FC } from 'react';
import { withTranslation } from '@rbx/intl';
import { Grid, useMediaQuery } from '@rbx/ui';
import type { GameDetailResponse } from '@modules/clients/games';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useOverviewVariant, { OverviewVariant } from '../hooks/useOverviewVariant';
import AudienceReachBanner from './AudienceReachBanner';
import useOverviewHeaderStyles from './OverviewHeader.styles';
import OverviewHeaderButtons from './OverviewHeaderButtons';
import OverviewHeaderInfoSection from './OverviewHeaderInfoSection';
import UniverseOverviewThumbnail from './UniverseOverviewThumbnail';

type OverviewHeaderProps = {
  universeDetails: GameDetailResponse;
};

const OverviewHeader: FC<OverviewHeaderProps> = ({ universeDetails }) => {
  const { classes: styles } = useOverviewHeaderStyles();
  const {
    params: { enableAudienceReachOnOverviewPage },
  } = useIXPParameters(IXPLayers.CreatorHubCreationsPermission);
  const isMobileView =
    useMediaQuery((theme) => theme.breakpoints.down('XLarge')) && enableAudienceReachOnOverviewPage;
  // Note: this is a bit of a stopgap to ensure that the analytics layout divider doesn't overlap with the
  // CTA buttons.  The designs omit the divider entirely, but removing it is likely nontrivial.
  const shouldAddDividerSpace =
    useMediaQuery((theme) => theme.breakpoints.down('Medium')) && enableAudienceReachOnOverviewPage;

  const { variant } = useOverviewVariant(universeDetails.id ?? 0);
  const showInsightsV2Overview = variant === OverviewVariant.Insights;

  let metadataClassName: string | undefined;
  if (enableAudienceReachOnOverviewPage) {
    metadataClassName = styles.metadataContainerAudienceReach;
  } else if (!showInsightsV2Overview) {
    metadataClassName = styles.metadataContainer;
  }

  const thumbnail = universeDetails.id && universeDetails.name && universeDetails.rootPlaceId && (
    <UniverseOverviewThumbnail
      universeId={universeDetails.rootPlaceId}
      universeName={universeDetails.name}
    />
  );

  return (
    <Grid
      item
      container
      direction='column'
      gap='36px'
      marginBottom={shouldAddDividerSpace ? '24px' : undefined}>
      {enableAudienceReachOnOverviewPage && <AudienceReachBanner />}
      <Grid
        item
        container
        direction='row'
        justifyContent='space-between'
        alignItems={isMobileView ? 'left' : 'center'}
        wrap='nowrap'
        display='flex'
        className={
          enableAudienceReachOnOverviewPage || showInsightsV2Overview ? undefined : styles.container
        }>
        <Grid item container direction='row'>
          <Grid
            item
            XSmall={4}
            className={
              showInsightsV2Overview ? styles.thumbnailContainerV2 : styles.thumbnailContainer
            }>
            {thumbnail}
          </Grid>
          <Grid
            item
            flexGrow={1}
            direction={enableAudienceReachOnOverviewPage && !isMobileView ? 'row' : 'column'}
            alignItems={isMobileView || !enableAudienceReachOnOverviewPage ? 'left' : 'center'}
            display='flex'
            className={metadataClassName}>
            <OverviewHeaderInfoSection
              universeDetails={universeDetails}
              enableAudienceReachOnOverviewPage={!!enableAudienceReachOnOverviewPage}
            />
            {universeDetails.id && universeDetails.rootPlaceId && (
              <OverviewHeaderButtons
                universeId={universeDetails.id}
                rootPlaceId={universeDetails.rootPlaceId}
                enableAudienceReachOnOverviewPage={!!enableAudienceReachOnOverviewPage}
              />
            )}
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default withTranslation(OverviewHeader, [
  TranslationNamespace.Creations,
  TranslationNamespace.Access,
]);
