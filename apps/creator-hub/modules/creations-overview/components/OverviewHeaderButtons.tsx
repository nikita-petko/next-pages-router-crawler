import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import Router from 'next/router';
import { useTranslation } from '@rbx/intl';
import { Button, Grid, useMediaQuery } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { Item } from '@modules/miscellaneous/common';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { getUrlForItemType } from '@modules/miscellaneous/urls';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import useOverviewVariant, { OverviewVariant } from '../hooks/useOverviewVariant';
import {
  logEditDetailsClick,
  logEditInStudioClick,
  logViewOnRobloxClick,
} from '../utils/OverviewSummaryLogger';
import EditInStudioButton from './EditInStudioButton';
import useOverviewHeaderStyles from './OverviewHeader.styles';
import OverviewHeaderContextMenu from './OverviewHeaderContextMenu';

type OverviewHeaderButtonsProps = {
  universeId: number;
  rootPlaceId: number;
  enableAudienceReachOnOverviewPage: boolean;
};

const OverviewHeaderButtons: FC<OverviewHeaderButtonsProps> = ({
  universeId,
  rootPlaceId,
  enableAudienceReachOnOverviewPage,
}) => {
  const { translate: RQAItranslate } = useRAQIV2TranslationDependencies();
  const { translate } = useTranslation();
  const { classes: styles } = useOverviewHeaderStyles();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const {
    params: { showEditInStudioButton },
  } = useIXPParameters(IXPLayers.CreatorHubNavigationUser);
  const { variant } = useOverviewVariant(universeId);
  const showInsightsV2Overview = variant === OverviewVariant.Insights;
  const isMobileView =
    useMediaQuery((theme) => theme.breakpoints.down('XLarge')) && enableAudienceReachOnOverviewPage;

  const viewOnRoblox = useCallback(() => {
    logViewOnRobloxClick(unifiedLogger, { universeId, placeId: rootPlaceId });
    const robloxUrl = getUrlForItemType(Item.Game, rootPlaceId);
    if (robloxUrl) {
      window.open(robloxUrl, '_blank');
    }
  }, [unifiedLogger, universeId, rootPlaceId]);

  const logEditInStudio = useCallback(() => {
    logEditInStudioClick(unifiedLogger, { universeId, placeId: rootPlaceId });
  }, [unifiedLogger, universeId, rootPlaceId]);

  const editDetails = useCallback(() => {
    logEditDetailsClick(unifiedLogger, { universeId, placeId: rootPlaceId });
    void Router.push(dashboard.getConfigureExperienceUrl(universeId));
  }, [unifiedLogger, universeId, rootPlaceId]);

  const buttonSize = useMemo(() => {
    if (isMobileView) {
      return 'small';
    }
    if (showInsightsV2Overview) {
      return 'medium';
    }
    return 'large';
  }, [isMobileView, showInsightsV2Overview]);

  return (
    <Grid
      item
      alignItems='center'
      flexShrink={0}
      marginTop={showInsightsV2Overview || isMobileView ? '12px' : undefined}>
      <Grid container spacing={1} direction={enableAudienceReachOnOverviewPage ? 'row' : undefined}>
        <Grid item className={styles.editInStudioContainer}>
          <EditInStudioButton
            size={buttonSize}
            universeId={universeId}
            placeId={rootPlaceId}
            onClick={logEditInStudio}
            enableAudienceReachOnOverviewPage={enableAudienceReachOnOverviewPage}
          />
        </Grid>
        <Grid item>
          {showEditInStudioButton ? (
            <Button
              size={buttonSize}
              color={enableAudienceReachOnOverviewPage ? 'secondary' : 'primary'}
              variant={enableAudienceReachOnOverviewPage ? 'contained' : 'text'}
              onClick={editDetails}>
              {translate('Action.EditDetails')}
            </Button>
          ) : (
            <Button
              size={buttonSize}
              color={enableAudienceReachOnOverviewPage ? 'secondary' : 'primary'}
              variant={enableAudienceReachOnOverviewPage ? 'contained' : 'text'}
              onClick={viewOnRoblox}>
              {RQAItranslate(translationKey('Label.ViewOnRoblox', TranslationNamespace.Creations))}
            </Button>
          )}
        </Grid>
        {showEditInStudioButton && (
          <OverviewHeaderContextMenu universeId={universeId} rootPlaceId={rootPlaceId} />
        )}
      </Grid>
    </Grid>
  );
};

export default OverviewHeaderButtons;
