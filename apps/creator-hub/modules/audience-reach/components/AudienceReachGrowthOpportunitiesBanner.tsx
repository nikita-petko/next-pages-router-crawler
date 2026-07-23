import type { FC } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { AgeBracketEnum, CreatorEligibilityEnum } from '@rbx/client-core-content-api/v1';
import { Button, clsx } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid } from '@rbx/ui';
import {
  CreatorHubCreationsPermissionParameters,
  IXPLayers,
} from '@modules/clients/ixpExperiments';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import IdVerificationDialog from '@modules/publishing-permissions/components/IdVerificationDialog';
import {
  idVerificationActionUrl,
  parentLinkActionUrl,
} from '@modules/publishing-permissions/constants/tiers';
import { useCreatorEligibility } from '@modules/publishing-permissions/hooks/useCreatorEligibility';
import styles from './AudienceReachGrowthOpportunitiesBanner.module.css';

const BANNER_IMAGE = `${process.env.assetPathPrefix}/home/publish_eligibility_banner.webp`;

interface AudienceReachGrowthOpportunitiesBannerProps {
  universeId?: number;
  showCallToAction?: boolean;
}

const AudienceReachGrowthOpportunitiesBanner: FC<AudienceReachGrowthOpportunitiesBannerProps> = ({
  universeId,
  showCallToAction = true,
}) => {
  const router = useRouter();
  const { translateWithNamespace } = useTranslation();
  const { params, isFetched: isAudienceReachIxpFetched } = useIXPParameters(
    IXPLayers.CreatorHubCreationsPermission,
  );
  const growthOpportunitiesBannerEnabled =
    params[CreatorHubCreationsPermissionParameters.EnableAudienceReachGrowthOpportunitiesBanner];
  const { gameDetails } = useCurrentGame();
  const universeIdFromContext = gameDetails?.id;
  const telemetryUniverseId =
    universeId ??
    (universeIdFromContext && universeIdFromContext > 0 ? universeIdFromContext : undefined);
  const isBannerEnabled = isAudienceReachIxpFetched && growthOpportunitiesBannerEnabled;
  const {
    data: creatorEligibility,
    isLoading: isCreatorEligibilityLoading,
    isFetching: isCreatorEligibilityFetching,
  } = useCreatorEligibility();
  const impressionLogged = useRef(false);
  const [isIdDialogOpen, setIsIdDialogOpen] = useState(false);
  const isOver18 = creatorEligibility?.ageBracket === AgeBracketEnum.Over18;
  const isBetween13And18 = creatorEligibility?.ageBracket === AgeBracketEnum.Between13And18;
  const hasCompletedIdVerification =
    creatorEligibility?.creatorEligibility.includes(CreatorEligibilityEnum.IdVerified) ?? false;
  const shouldShowStartCallToAction = isOver18 || isBetween13And18;
  const isLoadingEligibility = isCreatorEligibilityLoading || isCreatorEligibilityFetching;
  const isBannerVisible =
    isBannerEnabled &&
    !isLoadingEligibility &&
    Boolean(creatorEligibility) &&
    !hasCompletedIdVerification;

  useEffect(() => {
    if (!isBannerVisible || impressionLogged.current) {
      return;
    }

    impressionLogged.current = true;
    unifiedLoggerClient.logImpressionEvent({
      eventName: CreatorDashboardEventType.AudienceReachGrowthOpportunitiesBannerImpression,
      parameters: {
        page: 'audienceReach',
        ctaType: shouldShowStartCallToAction ? 'start' : 'viewDetails',
        ctaHidden: String(!showCallToAction),
        ...(telemetryUniverseId ? { universeId: String(telemetryUniverseId) } : {}),
      },
    });
  }, [isBannerVisible, showCallToAction, shouldShowStartCallToAction, telemetryUniverseId]);

  const handleClick = useCallback(() => {
    if (!isBannerVisible) {
      return;
    }

    const action = shouldShowStartCallToAction ? 'start' : 'viewDetails';
    unifiedLoggerClient.logClickEvent({
      eventName: CreatorDashboardEventType.AudienceReachGrowthOpportunitiesBannerClick,
      parameters: {
        page: 'audienceReach',
        action,
        ...(telemetryUniverseId ? { universeId: String(telemetryUniverseId) } : {}),
      },
    });
    if (isBetween13And18) {
      setIsIdDialogOpen(true);
      return;
    }

    if (shouldShowStartCallToAction) {
      return;
    }

    void router.push('/settings/eligibility/publishing-permissions');
  }, [isBannerVisible, isBetween13And18, router, shouldShowStartCallToAction, telemetryUniverseId]);

  if (!isBannerVisible) {
    return null;
  }

  return (
    <Grid item container direction='row' paddingBottom={4}>
      <div
        className={clsx(
          styles.heroBanner,
          'relative width-full flex items-center bg-surface-200 radius-large',
        )}>
        <img
          src={BANNER_IMAGE}
          alt=''
          aria-hidden
          className={clsx('block absolute width-full height-full')}
          style={{ top: 0, left: 0 }}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <div
          className={clsx(
            styles.heroTextContent,
            'dark-theme relative flex flex-col gap-medium padding-[32px]',
          )}>
          <div>
            <div className='text-heading-medium content-emphasis'>
              {translateWithNamespace(
                TranslationNamespace.AudienceReach,
                'Heading.ExpandGrowthOpportunities',
              )}{' '}
            </div>
            <div className='text-body-medium content-emphasis'>
              {translateWithNamespace(
                TranslationNamespace.AudienceReach,
                'Description.ExpandGrowthOpportunities',
              )}
            </div>
          </div>
          <div className={clsx(styles.buttonRow, 'flex gap-small')}>
            {showCallToAction ? (
              isOver18 ? (
                <Button
                  as='a'
                  href={idVerificationActionUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  onClick={handleClick}>
                  <span>
                    {translateWithNamespace(
                      TranslationNamespace.AudienceReach,
                      shouldShowStartCallToAction ? 'Action.Start' : 'Action.ViewDetails',
                    )}
                  </span>
                </Button>
              ) : (
                <Button onClick={handleClick}>
                  <span>
                    {translateWithNamespace(
                      TranslationNamespace.AudienceReach,
                      shouldShowStartCallToAction ? 'Action.Start' : 'Action.ViewDetails',
                    )}
                  </span>
                </Button>
              )
            ) : null}
          </div>
        </div>
      </div>
      {isBetween13And18 ? (
        <IdVerificationDialog
          open={isIdDialogOpen}
          onOpenChange={setIsIdDialogOpen}
          onContinueWithId={() => {
            window.open(idVerificationActionUrl, '_blank', 'noopener,noreferrer');
            setIsIdDialogOpen(false);
          }}
          onAddParent={() => {
            window.open(parentLinkActionUrl, '_blank', 'noopener,noreferrer');
            setIsIdDialogOpen(false);
          }}
        />
      ) : null}
    </Grid>
  );
};

export default withTranslation(AudienceReachGrowthOpportunitiesBanner, [
  TranslationNamespace.AudienceReach,
  TranslationNamespace.PublicPublish,
]);
